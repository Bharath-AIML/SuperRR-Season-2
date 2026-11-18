import { useMemo, useState } from 'react'
import { PLAYERS, Player, Side, SIDE_LABEL, SIDE_COLOR, UNIT, f0, f1, f2, signed, pct0, certainty, CERTAINTY_LABEL, MODEL } from '../lib/data'
import { RankIntervals } from './Charts'
import { Portrait, hasPhoto, photoCredit } from './Portrait'
import { answer, SUGGESTIONS } from '../lib/query'

type SortKey = 'rank' | 'top10_prob' | 'n_h' | 'S_h'
const SORTS: [SortKey, string][] = [['rank', 'Rank'], ['top10_prob', 'Stability'], ['n_h', 'Pressure balls'], ['S_h', 'Shrunk result']]

function RatingBar({ p, max }: { p: Player; max: number }) {
  const w = 220, x = (v: number) => (Math.max(v, 0) / max) * w
  return (
    <svg viewBox={`0 0 ${w} 26`} width="100%" height="26" role="img" aria-label={`Final rating ${f2(p.final)}, bootstrap 90% interval ${f2(p.final_p05)} to ${f2(p.final_p95)}`} style={{ display: 'block' }}>
      <rect x={0} y={4} width={x(p.final)} height={14} fill={SIDE_COLOR[p.side]} className="draw" />
      <line x1={x(p.final_p05)} x2={x(p.final_p95)} y1={11} y2={11} stroke="currentColor" strokeWidth={1.4} />
      <line x1={x(p.final_p05)} x2={x(p.final_p05)} y1={5} y2={17} stroke="currentColor" strokeWidth={1.4} /><line x1={x(p.final_p95)} x2={x(p.final_p95)} y1={5} y2={17} stroke="currentColor" strokeWidth={1.4} />
    </svg>
  )
}

export function Results({ side, setSide, onOpen }: { side: Side; setSide: (s: Side) => void; onOpen: (p: Player) => void }) {
  const [sort, setSort] = useState<SortKey>('rank')
  const list = PLAYERS[side]
  const hero = list[0]
  const rest = useMemo(() => [...list.slice(1)].sort((a, b) => (sort === 'rank' ? a.rank - b.rank : (b[sort] as number) - (a[sort] as number))), [list, sort])
  const max = Math.max(...list.map((p) => p.final_p95))
  const nBoot = 300
  return (
    <div>
      <div className="results-tools">
        <div className="seg" role="group" aria-label="Choose batters or bowlers">
          {(['bat', 'bowl'] as Side[]).map((s) => <button key={s} aria-pressed={side === s} onClick={() => setSide(s)}>{SIDE_LABEL[s]}</button>)}
        </div>
        <div className="sortrow" role="group" aria-label="Sort the remaining nine">
          <span className="caps">Sort ranks 2–10 by</span>
          {SORTS.map(([k, l]) => <button key={k} className="chip" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}
        </div>
      </div>
      <div className="honest">
        <div className="note"><b>What “share in top 10” means.</b> We resampled whole matches {nBoot} times and re-ran the entire ranking. The figure is the proportion of those resamples in which the player stayed in the top 10 — a measure of how stable <em>our ranking</em> is. It is not the probability that the player performs well in a real match.</div>
        <div className="note red"><b>Units.</b> {SIDE_LABEL[side]}: {UNIT[side]}. “Raw” is what happened; “shrunk” is the same estimate after pulling small samples toward the average; the shrunk value is what the rating uses.</div>
      </div>

      <div className="hero-r">
        <div className="rk" style={{ color: SIDE_COLOR[side] }} aria-hidden>1</div>
        <div>
          <div className="caps muted">Rank 1 · {SIDE_LABEL[side].toLowerCase().slice(0, -1)} under pressure</div>
          <h3>{hero.name}</h3>
          <div className="sub">
            <span>Pressure balls <b>{hero.n_h}</b></span><span>Pressure matches <b>{hero.m_h}</b></span><span>Baseline <b>{signed(hero.S_l)}</b></span><span>Raw → shrunk <b>{signed(hero.S_h_raw)} → {signed(hero.S_h)}</b></span>
            <span>Top-10 share <b>{pct0(hero.top10_prob)}</b></span><span>Median rank <b>{hero.rank_median}</b> <span className="muted">(90%: {hero.rank_p05}–{hero.rank_p95})</span></span>
          </div>
          <button className="chip open" onClick={() => onOpen(hero)}>Why {hero.name.split(' ')[0]}? Open the evidence →</button>
        </div>
        <div className="ph"><Portrait id={hero.player_id} name={hero.name} size={190} />{hasPhoto(hero.player_id) && <p className="src">Photo: {photoCredit(hero.player_id).artist.slice(0, 40)} · {photoCredit(hero.player_id).license}</p>}</div>
      </div>

      <table className="ledger">
        <caption className="sr">Ranks 2 to 10 for {SIDE_LABEL[side]}</caption>
        <thead><tr><th>#</th><th>Player</th><th>Rating (bar) · 90% bootstrap interval</th><th className="num">Pressure balls · matches</th><th className="num">Baseline</th><th className="num">Raw → shrunk</th><th className="num">Share in top 10</th><th className="num">Median rank (90%)</th></tr></thead>
        <tbody>
          {rest.map((p) => (
            <tr key={p.player_id} className="row" onClick={() => onOpen(p)}>
              <td className="rank" style={{ color: 'inherit' }}>{p.rank}</td>
              <td className="who"><div className="wrap2"><Portrait id={p.player_id} name={p.name} size={52} /><div><button onClick={(e) => { e.stopPropagation(); onOpen(p) }} aria-label={`Open evidence for ${p.name}, rank ${p.rank}`}>{p.name}</button><span className="muted mono">ID {p.player_id}</span><span className={`cert ${certainty(p)}`}>{CERTAINTY_LABEL[certainty(p)]}</span></div></div></td>
              <td className="bar"><RatingBar p={p} max={max} /><span className="mono" style={{ fontSize: 12 }}>{f2(p.final)}</span></td>
              <td className="num" data-l="Pressure balls · matches">{p.n_h} · {p.m_h}</td><td className="num" data-l="Baseline">{signed(p.S_l)}</td>
              <td className="num" data-l="Raw → shrunk">{signed(p.S_h_raw)} → {signed(p.S_h)}</td><td className="num" data-l="Share in top 10">{pct0(p.top10_prob)}</td><td className="num" data-l="Median rank">{p.rank_median} ({p.rank_p05}–{p.rank_p95})</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="src">source: outputs/SUBMISSION_rankings.csv · outputs/tables/FINAL_top10_{side}.csv · bars show the final rating with its 90% bootstrap interval (300 match-level resamples).</p>

      <div style={{ marginTop: 56 }}>
        <div className="chart"><h3>How firmly does each rank hold?</h3>
          <p className="reading">{hero.name} is within the top {hero.rank_p95} in 95% of resamples. The lower places overlap heavily with players outside the list; hatched bars mark a 90% range wider than 25 places.</p></div>
        <RankIntervals side={side} onOpen={onOpen} />
        <p className="src">source: {side}_bootstrap_summary.csv (rank_p05, rank_median, rank_p95)</p>
      </div>
    </div>
  )
}

export function AskTheData() {
  const [q, setQ] = useState('')
  const [a, setA] = useState(() => answer(SUGGESTIONS[0]))
  const run = (text: string) => { setQ(text); setA(answer(text)) }
  return (
    <div className="stat">
      <p className="caps" style={{ color: 'var(--flood)', marginBottom: 6 }}>Ask the published dataset</p>
      <p style={{ color: 'rgba(241,233,215,.8)', fontSize: 15 }}>This is not an AI chatbot. It is a small deterministic parser running in your browser over the 20 selected players’ published evidence tables. It understands rankings by a metric, comparisons (“Compare A and B”), certainty questions and eligibility counts.</p>
      <form onSubmit={(e) => { e.preventDefault(); run(q) }} role="search" aria-label="Ask the dataset">
        <label className="sr" htmlFor="ask-input">Question</label>
        <input id="ask-input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Compare Jasprit Bumrah and Haris Rauf" autoComplete="off" />
        <button type="submit">Ask</button>
      </form>
      <div className="chips">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => run(s)}>{s}</button>)}</div>
      <div aria-live="polite">
        <h3 style={{ fontSize: '1.7rem', marginBottom: 8 }}>{a.title}</h3>
        <p className="reading">{a.interpretation}</p>
        {a.rows.length > 0 && <table><thead><tr>{a.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{a.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>}
        {a.note && <p className="src" style={{ color: 'rgba(241,233,215,.6)' }}>{a.note}</p>}
      </div>
    </div>
  )
}
