import { useMemo, useState } from 'react'
import { ELIGIBLE, MODEL, PLAYERS, SENS, SHARE, Side, SIDE_COLOR, Player, f1, f2, pct0, signed, certainty, rankSpan, contrib, WEIGHTS, COMP_MIN_BALLS } from '../lib/data'

type Tip = { x: number; y: number; html: JSX.Element } | null
function useTip() {
  const [tip, setTip] = useState<Tip>(null)
  const el = tip ? <div className="tip" style={{ left: Math.min(tip.x + 14, window.innerWidth - 250), top: tip.y + 14 }} role="status">{tip.html}</div> : null
  return { tip, setTip, el }
}
const nice = (lo: number, hi: number, n = 6) => {
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? mag * 10
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6))
  return out
}
const short = (n: string) => { const p = n.split(' '); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : n }

/** Pressure vs baseline scatter: every eligible player (grey) with the selected ten labelled. */
export function PressureVsBaseline({ side, onOpen }: { side: Side; onOpen: (p: Player) => void }) {
  const { setTip, el } = useTip()
  const pts = ELIGIBLE[side], top = PLAYERS[side]
  const W = 760, H = 520, m = { l: 56, r: 16, t: 16, b: 52 }
  const xs = pts.map((p) => p.S_l), ys = pts.map((p) => p.S_h_raw)
  const lo = Math.floor(Math.min(...xs, ...ys) / 20) * 20, hi = Math.ceil(Math.max(...xs, ...ys) / 20) * 20
  const sx = (v: number) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r)
  const sy = (v: number) => H - m.b - ((v - lo) / (hi - lo)) * (H - m.t - m.b)
  const ticks = nice(lo, hi, 7)
  const topIds = new Set(top.map((p) => p.player_id))
  const color = SIDE_COLOR[side]
  // greedy vertical label spacing so labels in the dense cluster stay readable
  const labelY = new Map<number, number>()
  ;[...top].sort((a, b) => sy(a.S_h_raw) - sy(b.S_h_raw)).reduce((prev, p) => { const y = Math.max(sy(p.S_h_raw), prev + 14); labelY.set(p.player_id, y); return y }, -99)
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Scatter of ${pts.length} eligible ${side === 'bat' ? 'batters' : 'bowlers'}: baseline versus raw pressure result, per 100 balls versus expectation. The selected ten are labelled.`}>
        <g className="axis">{ticks.map((t) => <g key={t}><line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} /><line y1={m.t} y2={H - m.b} x1={sx(t)} x2={sx(t)} /><text x={m.l - 8} y={sy(t) + 4} textAnchor="end">{t}</text><text x={sx(t)} y={H - m.b + 18} textAnchor="middle">{t}</text></g>)}</g>
        <line className="zero" x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} /><line className="zero" y1={m.t} y2={H - m.b} x1={sx(0)} x2={sx(0)} />
        <line x1={sx(lo)} y1={sy(lo)} x2={sx(hi)} y2={sy(hi)} stroke="var(--ink)" strokeDasharray="3 5" />
        <text x={sx(hi) - 4} y={sy(hi) + 14} textAnchor="end">same as baseline</text>
        {pts.filter((p) => !topIds.has(p.pid)).map((p) => (
          <circle key={p.pid} cx={sx(p.S_l)} cy={sy(p.S_h_raw)} r={3.2} fill="var(--paper-3)" stroke="var(--muted)" strokeWidth={0.6}
            onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, html: <><b>{p.name}</b>baseline {signed(p.S_l)} · pressure {signed(p.S_h_raw)}<br />{p.n_h} pressure balls</> })} onMouseLeave={() => setTip(null)} />
        ))}
        {top.map((p) => (
          <g key={p.player_id} tabIndex={0} role="button" aria-label={`${p.name}, rank ${p.rank}. Open evidence.`} onClick={() => onOpen(p)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(p)} style={{ cursor: 'pointer' }}
            onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, html: <><b>{p.rank}. {p.name}</b>baseline {signed(p.S_l)} · pressure (raw) {signed(p.S_h_raw)}<br />{p.n_h} pressure balls</> })} onMouseLeave={() => setTip(null)}>
            <circle cx={sx(p.S_l)} cy={sy(p.S_h_raw)} r={6.5} fill={color} stroke="var(--ink)" strokeWidth={1.4} />
            {Math.abs(labelY.get(p.player_id)! - sy(p.S_h_raw)) > 3 && <line x1={sx(p.S_l) + 6} y1={sy(p.S_h_raw)} x2={sx(p.S_l) + 20} y2={labelY.get(p.player_id)! } stroke="var(--muted)" strokeWidth={0.7} />}
            <text className="lab" x={sx(p.S_l) + 22} y={labelY.get(p.player_id)! + 4}>{p.rank} {short(p.name)}</text>
          </g>
        ))}
        <text x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle">Baseline: ordinary balls, per 100 balls vs expectation</text>
        <text transform={`rotate(-90 14 ${H / 2})`} x={14} y={H / 2} textAnchor="middle">Under pressure (raw), per 100 balls vs expectation</text>
      </svg>
      {el}
    </figure>
  )
}

/** Bootstrap 90% rank ranges on a log rank axis. */
export function RankIntervals({ side, onOpen }: { side: Side; onOpen: (p: Player) => void }) {
  const list = PLAYERS[side]
  const W = 760, rowH = 38, m = { l: 190, r: 24, t: 30, b: 34 }, H = m.t + m.b + list.length * rowH
  const maxR = 130
  const sx = (r: number) => m.l + (Math.log(r) / Math.log(maxR)) * (W - m.l - m.r)
  const ticks = [1, 2, 3, 5, 10, 20, 50, 100]
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bootstrap 90% rank ranges for each selected player on a logarithmic rank axis">
        <g className="axis">{ticks.map((t) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={m.t - 6} y2={H - m.b} /><text x={sx(t)} y={H - m.b + 18} textAnchor="middle">{t}</text></g>)}</g>
        <rect x={sx(1)} y={m.t - 6} width={sx(10) - sx(1)} height={H - m.b - m.t + 6} fill="rgba(232,96,43,.12)" />
        <text x={sx(1) + 6} y={m.t - 12}>inside the top 10 →</text>
        {list.map((p, i) => {
          const y = m.t + i * rowH + rowH / 2, wide = rankSpan(p) > 25, c = SIDE_COLOR[side]
          return (
            <g key={p.player_id} tabIndex={0} role="button" aria-label={`${p.name}: median rank ${p.rank_median}, 90% range ${p.rank_p05} to ${p.rank_p95}`} style={{ cursor: 'pointer' }} onClick={() => onOpen(p)} onKeyDown={(e) => (e.key === 'Enter') && onOpen(p)}>
              <text className="lab" x={m.l - 12} y={y + 4} textAnchor="end">{p.rank}. {p.name}</text>
              <line x1={sx(p.rank_p05)} x2={sx(p.rank_p95)} y1={y} y2={y} stroke={wide ? '#a8430f' : c} strokeWidth={wide ? 8 : 5} strokeDasharray={wide ? '2 3' : undefined} strokeLinecap="butt" className="draw" style={{ animationDelay: `${i * 35}ms`, transformOrigin: `${sx(p.rank_p05)}px ${y}px` }} />
              <circle cx={sx(p.rank_median)} cy={y} r={6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2} />
              <text x={sx(p.rank_p95) + 8} y={y + 4}>{p.rank_p05}–{p.rank_p95}</text>
            </g>
          )
        })}
        <text x={(m.l + W - m.r) / 2} y={H - 2} textAnchor="middle">Rank across 300 match-level bootstrap resamples (log scale): dot = median, bar = 90% range</text>
      </svg>
    </figure>
  )
}

/** Stacked contribution of H / R / C to each player's final rating. */
export function Contributions({ side }: { side: Side }) {
  const list = PLAYERS[side]
  const W = 760, rowH = 34, m = { l: 190, r: 70, t: 22, b: 30 }, H = m.t + m.b + list.length * rowH
  const maxV = Math.max(...list.map((p) => p.final)) * 1.08
  const sx = (v: number) => m.l + (v / maxV) * (W - m.l - m.r)
  const col = { H: 'var(--ink)', R: '#a59780', C: SIDE_COLOR[side] }
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Contribution of H, R and C to each final rating">
        <g className="axis">{nice(0, maxV, 5).map((t) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={m.t} y2={H - m.b} /><text x={sx(t)} y={H - m.b + 18} textAnchor="middle">{t}</text></g>)}</g>
        {list.map((p, i) => {
          const c = contrib(p), y = m.t + i * rowH + 6; let x = 0
          return (
            <g key={p.player_id}>
              <text className="lab" x={m.l - 12} y={y + 15} textAnchor="end">{p.rank}. {p.name}</text>
              {(['H', 'R', 'C'] as const).map((k) => { const w = Math.max(c[k], 0); const r = <rect key={k} x={sx(x)} y={y} width={sx(w) - sx(0)} height={22} fill={col[k]}><title>{k}: {f2(c[k])}</title></rect>; x += w; return r })}
              <text x={sx(x) + 8} y={y + 16}>{f2(p.final)}</text>
            </g>
          )
        })}
        <g transform={`translate(${m.l} ${H - 4})`}><rect width={10} height={10} y={-10} fill={col.H} /><text x={14} y={-1}>0.60·H absolute pressure</text><rect x={190} width={10} height={10} y={-10} fill={col.R} /><text x={204} y={-1}>0.25·R deviation</text><rect x={330} width={10} height={10} y={-10} fill={col.C} /><text x={344} y={-1}>0.15·C consistency</text></g>
      </svg>
    </figure>
  )
}

/** Raw vs shrunk pressure result against sample size: why small samples are pulled in. */
export function Shrinkage({ side }: { side: Side }) {
  const { setTip, el } = useTip()
  const pts = ELIGIBLE[side]
  const W = 760, H = 420, m = { l: 56, r: 16, t: 16, b: 46 }
  const lo = Math.floor(Math.min(...pts.map((p) => Math.min(p.S_h_raw, p.S_h))) / 20) * 20, hi = Math.ceil(Math.max(...pts.map((p) => p.S_h_raw)) / 20) * 20
  const nx = Math.log(36), nxm = Math.log(Math.max(...pts.map((p) => p.n_h)))
  const sx = (n: number) => m.l + ((Math.log(n) - nx) / (nxm - nx)) * (W - m.l - m.r)
  const sy = (v: number) => H - m.b - ((v - lo) / (hi - lo)) * (H - m.t - m.b)
  const c = SIDE_COLOR[side]
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Raw and shrunk pressure results against the number of high-pressure balls">
        <g className="axis">{nice(lo, hi, 6).map((t) => <g key={t}><line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} /><text x={m.l - 8} y={sy(t) + 4} textAnchor="end">{t}</text></g>)}{[36, 50, 100, 200, 400, 800].filter((n) => Math.log(n) <= nxm).map((n) => <g key={n}><line y1={m.t} y2={H - m.b} x1={sx(n)} x2={sx(n)} /><text x={sx(n)} y={H - m.b + 18} textAnchor="middle">{n}</text></g>)}</g>
        <line className="zero" x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} />
        {pts.map((p) => <line key={'l' + p.pid} x1={sx(p.n_h)} x2={sx(p.n_h)} y1={sy(p.S_h_raw)} y2={sy(p.S_h)} stroke={c} strokeOpacity={0.25} />)}
        {pts.map((p) => <circle key={'r' + p.pid} cx={sx(p.n_h)} cy={sy(p.S_h_raw)} r={3} fill="none" stroke="var(--muted)" onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, html: <><b>{p.name}</b>{p.n_h} balls · raw {signed(p.S_h_raw)} → shrunk {signed(p.S_h)}</> })} onMouseLeave={() => setTip(null)} />)}
        {pts.map((p) => <circle key={'s' + p.pid} cx={sx(p.n_h)} cy={sy(p.S_h)} r={3} fill={c} />)}
        <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle">High-pressure balls (log scale)</text>
        <text transform={`rotate(-90 14 ${H / 2})`} x={14} y={H / 2} textAnchor="middle">per 100 balls vs expectation</text>
        <circle cx={W - 220} cy={m.t + 8} r={4} fill="none" stroke="var(--muted)" /><text x={W - 210} y={m.t + 12}>raw</text><circle cx={W - 160} cy={m.t + 8} r={4} fill={c} /><text x={W - 150} y={m.t + 12}>shrunk (empirical Bayes)</text>
      </svg>
      {el}
    </figure>
  )
}

/** Share of deliveries classed high pressure, by innings and phase. */
export function ShareBars() {
  const order = ['powerplay', 'middle', 'death']
  const W = 520, H = 300, m = { l: 44, r: 10, t: 16, b: 44 }
  const bw = 46, gap = 20
  const maxV = 35
  const sy = (v: number) => H - m.b - (v / maxV) * (H - m.t - m.b)
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Share of deliveries classed high pressure by innings and phase">
        <g className="axis">{[0, 10, 20, 30].map((t) => <g key={t}><line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} /><text x={m.l - 6} y={sy(t) + 4} textAnchor="end">{t}%</text></g>)}</g>
        {order.map((ph, i) => {
          const x0 = m.l + 14 + i * (2 * bw + gap + 22)
          return (
            <g key={ph}>
              {[1, 2].map((inn, k) => {
                const v = SHARE.find((s) => s.innings === inn && s.phase === ph)!.high_share_pct
                return <g key={inn}><rect x={x0 + k * (bw + 4)} y={sy(v)} width={bw} height={sy(0) - sy(v)} fill={k === 0 ? 'var(--ink)' : 'var(--seam)'} className="draw" style={{ transformOrigin: `${x0}px ${sy(0)}px` }} /><text x={x0 + k * (bw + 4) + bw / 2} y={sy(v) - 5} textAnchor="middle">{v.toFixed(0)}%</text><text x={x0 + k * (bw + 4) + bw / 2} y={sy(0) + 14} textAnchor="middle">{inn === 1 ? '1st' : '2nd'}</text></g>
              })}
              <text className="lab" x={x0 + bw + 2} y={H - 8} textAnchor="middle">{ph}</text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

/** Calibration of the chase win-probability model: predicted vs observed win rate (held-out matches). */
export function Calibration() {
  const rows = (MODEL.wp.innings2.calibration as { bin: string; n: number; mean_p: number; obs: number }[])
  const W = 440, H = 440, m = { l: 48, r: 14, t: 14, b: 44 }
  const sx = (v: number) => m.l + v * (W - m.l - m.r), sy = (v: number) => H - m.b - v * (H - m.t - m.b)
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Calibration plot: predicted chase win probability against observed win rate, points lie on the diagonal">
        <g className="axis">{[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => <g key={t}><line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} /><line y1={m.t} y2={H - m.b} x1={sx(t)} x2={sx(t)} /><text x={m.l - 6} y={sy(t) + 4} textAnchor="end">{t}</text><text x={sx(t)} y={H - m.b + 16} textAnchor="middle">{t}</text></g>)}</g>
        <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--ink)" strokeDasharray="3 5" />
        {rows.map((r) => <circle key={r.bin} cx={sx(r.mean_p)} cy={sy(r.obs)} r={3 + Math.sqrt(r.n) / 28} fill="var(--seam)" fillOpacity={0.8} stroke="var(--ink)"><title>{r.bin}: predicted {r.mean_p}, observed {r.obs}, n={r.n.toLocaleString()}</title></circle>)}
        <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle">Predicted win probability of the chasing side (held-out)</text>
        <text transform={`rotate(-90 12 ${H / 2})`} x={12} y={H / 2} textAnchor="middle">Observed win rate</text>
      </svg>
    </figure>
  )
}

/** IPL vs T20I raw pressure result per selected player, shown only where each competition has enough balls. */
export function CompSplit({ side }: { side: Side }) {
  const list = PLAYERS[side]
  const W = 760, rowH = 34, m = { l: 190, r: 24, t: 26, b: 34 }, H = m.t + m.b + list.length * rowH
  const vals = list.flatMap((p) => [p.S_raw_IPL, p.S_raw_T20I]).filter((v): v is number => v != null)
  const lo = Math.floor(Math.min(...vals, 0) / 20) * 20, hi = Math.ceil(Math.max(...vals) / 20) * 20
  const sx = (v: number) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r)
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="IPL versus T20I raw pressure result per selected player; hollow markers mark competitions with fewer than 24 pressure balls, which are not drawn">
        <g className="axis">{nice(lo, hi, 6).map((t) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={m.t - 4} y2={H - m.b} /><text x={sx(t)} y={H - m.b + 18} textAnchor="middle">{t}</text></g>)}</g>
        <line className="zero" x1={sx(0)} x2={sx(0)} y1={m.t - 4} y2={H - m.b} />
        {list.map((p, i) => {
          const y = m.t + i * rowH + rowH / 2
          const a = p.n_press_IPL >= COMP_MIN_BALLS ? p.S_raw_IPL : null, b = p.n_press_T20I >= COMP_MIN_BALLS ? p.S_raw_T20I : null
          return (
            <g key={p.player_id}>
              <text className="lab" x={m.l - 12} y={y + 4} textAnchor="end">{p.rank}. {p.name}</text>
              {a != null && b != null && <line x1={sx(a)} x2={sx(b)} y1={y} y2={y} stroke="var(--paper-3)" strokeWidth={4} />}
              {a != null ? <circle cx={sx(a)} cy={y} r={6.5} fill="var(--ink)"><title>IPL: {signed(a)} per 100 balls, {p.n_press_IPL} balls</title></circle> : <text x={sx(0) + 8} y={y + 4}>IPL: {p.n_press_IPL} balls (too few)</text>}
              {b != null ? <rect x={sx(b) - 6} y={y - 6} width={12} height={12} fill={SIDE_COLOR[side]}><title>T20I: {signed(b)} per 100 balls, {p.n_press_T20I} balls</title></rect> : <text x={sx(0) + 8} y={y + 4}>T20I: {p.n_press_T20I} balls (too few)</text>}
            </g>
          )
        })}
        <g transform={`translate(${m.l} ${H - 6})`}><circle r={5} cy={-4} fill="var(--ink)" /><text x={10} y={0}>IPL</text><rect x={50} y={-10} width={10} height={10} fill={SIDE_COLOR[side]} /><text x={66} y={0}>T20I</text><text x={110} y={0}>per 100 balls vs expectation (raw) · shown only with ≥ {COMP_MIN_BALLS} high-pressure balls in that competition</text></g>
      </svg>
    </figure>
  )
}

/** Top-10 membership of the most frequent players across the sensitivity configurations. */
export function SensitivityMatrix({ side }: { side: Side }) {
  const grid = SENS[side]
  const base = PLAYERS[side].map((p) => p.player_id)
  const freq = new Map<number, number>()
  grid.forEach((g) => g.top10.forEach((id) => freq.set(id, (freq.get(id) ?? 0) + 1)))
  const players = [...freq.entries()].sort((a, b) => (base.includes(b[0]) ? 1 : 0) - (base.includes(a[0]) ? 1 : 0) || b[1] - a[1]).slice(0, 16).map(([id]) => id)
  const sorted = [...players].sort((a, b) => (base.indexOf(a) === -1 ? 99 : base.indexOf(a)) - (base.indexOf(b) === -1 ? 99 : base.indexOf(b)) || (freq.get(b)! - freq.get(a)!))
  const cell = 17, W = 190 + grid.length * cell + 20, rowH = 22, topH = 230, H = topH + sorted.length * rowH + 10
  const labs = grid.map((g) => g.label.replace('final weights H/R/C=', 'weights ').replace('elig N>=', 'N≥').replace(',M>=', ' M≥').replace('top_share=', 'top '))
  return (
    <figure className="chart">
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 640 }} role="img" aria-label="Matrix of top-10 membership across all sensitivity configurations">
          {labs.map((l, j) => <text key={j} transform={`translate(${190 + j * cell + cell / 2} ${topH - 8}) rotate(-62)`} fontSize={9.5} textAnchor="start" style={{ fontSize: 9.5 }}>{l}</text>)}
          {sorted.map((id, i) => {
            const y = topH + i * rowH, inBase = base.includes(id)
            return (
              <g key={id}>
                <text className="lab" x={180} y={y + 15} textAnchor="end" style={{ fontWeight: inBase ? 700 : 400, fill: inBase ? 'var(--ink)' : 'var(--muted)' }}>{inBase ? `${base.indexOf(id) + 1}. ` : ''}{SENS.names[String(id)]}</text>
                {grid.map((g, j) => <rect key={j} x={190 + j * cell + 1} y={y + 2} width={cell - 2} height={rowH - 4} fill={g.top10.includes(id) ? SIDE_COLOR[side] : 'var(--paper-2)'} />)}
              </g>
            )
          })}
        </svg>
      </div>
    </figure>
  )
}
