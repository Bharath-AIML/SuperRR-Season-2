// Deterministic "ask the data" engine. No LLM, no network: a small intent parser over the published dataset
// (the 20 selected players' full evidence, plus the eligible-player table for counts).
import { PLAYERS, ALL_PLAYERS, ELIGIBLE, Player, Side, f1, f2, pct0, signed, SIDE_LABEL, certainty, CERTAINTY_LABEL } from './data'

export interface Answer { title: string; interpretation: string; columns: string[]; rows: (string | number)[][]; note?: string }

const METRICS: { keys: string[]; label: string; get: (p: Player) => number; fmt: (x: number) => string; higher: boolean }[] = [
  { keys: ['pressure scoring', 'above expectation', 'raw', 'scoring'], label: 'Raw pressure result (per 100 balls vs expectation)', get: (p) => p.S_h_raw, fmt: (x) => signed(x), higher: true },
  { keys: ['shrunk', 'shrinkage', 'adjusted', 'reliable'], label: 'Shrunk pressure result (per 100 balls)', get: (p) => p.S_h, fmt: (x) => signed(x), higher: true },
  { keys: ['baseline', 'normal', 'ordinary'], label: 'Non-pressure baseline (per 100 balls)', get: (p) => p.S_l, fmt: (x) => signed(x), higher: true },
  { keys: ['probability', 'top 10', 'top-10', 'bootstrap', 'stable', 'stability'], label: 'Share of bootstrap resamples in top 10', get: (p) => p.top10_prob, fmt: (x) => pct0(x), higher: true },
  { keys: ['sample', 'most pressure balls', 'balls', 'evidence', 'volume'], label: 'High-pressure balls', get: (p) => p.n_h, fmt: (x) => String(Math.round(x)), higher: true },
  { keys: ['matches', 'pressure matches'], label: 'High-pressure matches', get: (p) => p.m_h, fmt: (x) => String(Math.round(x)), higher: true },
  { keys: ['consisten'], label: 'Consistency C (shrunk share of positive pressure matches)', get: (p) => p.C_raw, fmt: (x) => pct0(x), higher: true },
  { keys: ['rating', 'final', 'best', 'highest', 'top'], label: 'Final rating', get: (p) => p.final, fmt: (x) => f2(x), higher: true },
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export function findPlayers(q: string): Player[] {
  const nq = ' ' + norm(q) + ' '
  const hits: Player[] = []
  for (const p of ALL_PLAYERS) {
    const parts = norm(p.name).split(' ')
    const full = norm(p.name)
    const last = parts[parts.length - 1]
    const first = parts[0]
    if (nq.includes(' ' + full + ' ') || (last.length > 3 && nq.includes(' ' + last + ' ')) || (first.length > 4 && nq.includes(' ' + first + ' '))) hits.push(p)
  }
  // de-duplicate ambiguous surnames (e.g. two "Sharma"): keep only exact full-name hits if multiple share a surname hit
  const byLast = new Map<string, Player[]>()
  hits.forEach((p) => { const l = norm(p.name).split(' ').pop()!; byLast.set(l, [...(byLast.get(l) ?? []), p]) })
  return hits.filter((p) => {
    const l = norm(p.name).split(' ').pop()!
    return (byLast.get(l)!.length === 1) || nq.includes(' ' + norm(p.name) + ' ') || nq.includes(' ' + norm(p.name).split(' ')[0] + ' ')
  })
}

export const SUGGESTIONS = [
  'Who has the highest pressure scoring above expectation among batters?',
  'Compare Jasprit Bumrah and Haris Rauf',
  'Which bowlers are the least certain?',
  'Most high-pressure balls bowlers',
  'Compare Abhishek Sharma and Suryakumar Yadav',
  'How many players were eligible?',
]

export function answer(qRaw: string): Answer {
  const q = norm(qRaw)
  if (!q) return { title: 'Ask something', interpretation: 'Type a question or pick one of the examples.', columns: [], rows: [] }
  const side: Side | null = /\b(bowler|bowlers|bowling)\b/.test(q) ? 'bowl' : /\b(batter|batters|batting|batsman|batsmen)\b/.test(q) ? 'bat' : null

  if (/eligib/.test(q)) {
    return { title: 'Eligible players', interpretation: 'Players with at least 36 high-pressure balls in at least 5 matches.', columns: ['Group', 'Eligible players'],
      rows: [['Batters', ELIGIBLE.bat.length], ['Bowlers', ELIGIBLE.bowl.length]], note: 'From the eligible-player table of the final run.' }
  }

  const named = findPlayers(qRaw)
  if (/compare|versus|\bvs\b|against|difference/.test(q) && named.length >= 2) {
    const [a, b] = named.slice(0, 2)
    const rows: (string | number)[][] = [
      ['Side', SIDE_LABEL[a.side], SIDE_LABEL[b.side]], ['Rank', a.rank, b.rank], ['High-pressure balls', a.n_h, b.n_h], ['High-pressure matches', a.m_h, b.m_h],
      ['Raw pressure result /100 balls', signed(a.S_h_raw), signed(b.S_h_raw)], ['Shrunk pressure result /100 balls', signed(a.S_h), signed(b.S_h)],
      ['Baseline /100 balls', signed(a.S_l), signed(b.S_l)], ['Final rating', f2(a.final), f2(b.final)],
      ['Top-10 share of bootstrap resamples', pct0(a.top10_prob), pct0(b.top10_prob)], ['Median rank (90% range)', `${a.rank_median} (${a.rank_p05}–${a.rank_p95})`, `${b.rank_median} (${b.rank_p05}–${b.rank_p95})`],
    ]
    return { title: `${a.name} vs ${b.name}`, interpretation: a.side === b.side ? 'Same-side comparison using the published evidence table.' : 'Batter and bowler figures are measured on different scales (runs above expectation vs runs saved) — compare ranks and certainty, not raw units.',
      columns: ['Measure', a.name, b.name], rows, note: 'Source: FINAL_top10 tables.' }
  }
  if (named.length === 1 && !/top|best|highest|most|least|which|who/.test(q)) {
    const p = named[0]
    return { title: p.name, interpretation: `${SIDE_LABEL[p.side].slice(0, -1)} ranked ${p.rank}. ${CERTAINTY_LABEL[certainty(p)]}.`, columns: ['Measure', 'Value'],
      rows: [['High-pressure balls / matches', `${p.n_h} / ${p.m_h}`], ['Raw → shrunk pressure result /100 balls', `${signed(p.S_h_raw)} → ${signed(p.S_h)}`], ['Baseline /100 balls', signed(p.S_l)],
        ['Final rating', f2(p.final)], ['Top-10 share of bootstrap resamples', pct0(p.top10_prob)], ['Median rank (90% range)', `${p.rank_median} (${p.rank_p05}–${p.rank_p95})`]] }
  }

  if (/uncertain|least certain|least stable|doubt|weak/.test(q)) {
    const list = [...PLAYERS[side ?? 'bat'], ...(side ? [] : PLAYERS.bowl)].sort((x, y) => x.top10_prob - y.top10_prob).slice(0, 6)
    return { title: 'Least certain selections', interpretation: 'Ordered by the share of match-level bootstrap resamples in which the player stays in the top 10 (lowest first). This is a stability measure of the ranking, not a prediction of match performance.',
      columns: ['Player', 'Side', 'Rank', 'Top-10 share', 'Median rank (90% range)'], rows: list.map((p) => [p.name, SIDE_LABEL[p.side], p.rank, pct0(p.top10_prob), `${p.rank_median} (${p.rank_p05}–${p.rank_p95})`]) }
  }

  // ranking by metric
  const order = [...METRICS].sort((m1, m2) => Math.max(...m2.keys.map((k) => (q.includes(k) ? k.length : 0))) - Math.max(...m1.keys.map((k) => (q.includes(k) ? k.length : 0))))
  const metric = order.find((m) => m.keys.some((k) => q.includes(k))) ?? METRICS[METRICS.length - 1]
  const lowest = /lowest|least|fewest|worst/.test(q)
  const pool = side ? PLAYERS[side] : ALL_PLAYERS
  const nMatch = q.match(/top (\d+)|(\d+) (best|highest)/)
  const n = Math.min(10, nMatch ? parseInt(nMatch[1] || nMatch[2], 10) : 5)
  const sorted = [...pool].sort((x, y) => (lowest ? metric.get(x) - metric.get(y) : metric.get(y) - metric.get(x))).slice(0, n)
  return { title: `${lowest ? 'Lowest' : 'Highest'} by ${metric.label.toLowerCase()}`,
    interpretation: `Among the ${side ? SIDE_LABEL[side].toLowerCase() : 'selected players'} in the published top 10${side ? '' : ' lists'}. ${side ? '' : 'Batter and bowler values are on different scales; ask for one side for like-for-like ranking.'}`,
    columns: ['Player', 'Side', 'Rank', metric.label], rows: sorted.map((p) => [p.name, SIDE_LABEL[p.side], p.rank, metric.fmt(metric.get(p))]),
    note: `Interpreted as: metric = "${metric.label}", ${lowest ? 'ascending' : 'descending'}, ${side ? SIDE_LABEL[side] : 'both sides'}.` }
}
