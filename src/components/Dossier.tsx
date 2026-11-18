import { useEffect, useRef } from 'react'
import { Portrait, hasPhoto, photoCredit } from './Portrait'
import { PLAYERS, Player, SIDE_LABEL, UNIT, f1, f2, pct0, signed, contrib, certainty, CERTAINTY_LABEL, rankSpan, COMP_MIN_BALLS } from '../lib/data'

/** Evidence sentences generated from the player's actual fields. */
export function whySelected(p: Player): { h: string; body: string }[] {
  const c = contrib(p)
  const unitShort = p.side === 'bat' ? 'runs above' : 'runs saved against'
  const kept = p.S_h_raw !== 0 ? Math.round((p.S_h / p.S_h_raw) * 100) : 0
  const out = [
    { h: 'Evidence base', body: `${p.n_h} high-pressure balls across ${p.m_h} matches (${p.appearances} matches played in the data pack). The eligibility floor is 36 balls in 5 matches; this player clears it with ${Math.round(p.n_h / 36 * 10) / 10}× the ball minimum.` },
    { h: 'H — absolute pressure performance', body: `Raw result: ${signed(p.S_h_raw)} ${unitShort} expectation per 100 balls. After empirical-Bayes shrinkage (small samples are pulled toward the average) the estimate is ${signed(p.S_h)}, i.e. ${kept}% of the raw value is retained. That places the player ${f2(p.zH)} between-player standard deviations above average, contributing ${f2(c.H)} of the ${f2(p.final)} final rating.` },
    p.side === 'bat'
      ? { h: 'R — pressure-specific deviation', body: `R is 0 for every batter. After allowing for sampling error and for each batter's own baseline, the estimated between-player variance of pressure-specific deviation is zero, so the model gives no credit or penalty. The baseline is ${signed(p.S_l)} per 100 balls versus ${signed(p.S_h_raw)} raw under pressure — a difference we cannot separate from noise.` }
      : { h: 'R — pressure-specific deviation', body: `Shrunk deviation from what the player's own baseline (${signed(p.S_l)} per 100 balls) predicts: ${signed(p.R_raw)} per 100 balls, ${f2(p.zR)} true standard deviations, contributing ${f2(c.R)}. For bowlers this component is estimated to be real (non-zero between-player variance).` },
    { h: 'C — match-to-match consistency', body: `In matches where the player faced ${p.side === 'bat' ? 'at least 4 high-pressure balls' : 'at least 4 high-pressure balls'}, the net contribution was non-negative in about ${pct0(p.C_raw)} of matches after shrinkage toward the league share. This is ${f2(p.zC)} true standard deviations from average and contributes ${f2(c.C)}.` },
    { h: 'What did not score', body: p.side === 'bat'
      ? `Strike rate, boundary % and dot % are shown as evidence only, and the wicket-preservation component shrank to zero (its between-player variance was estimated at zero), so ${p.dismissals_press ?? 0} dismissals under pressure did not move the rating.`
      : `Economy, dot %, boundary % and extras are evidence only, and the wicket-taking component shrank to zero (between-player variance estimated at zero), so ${p.wickets_press ?? 0} bowler wickets under pressure did not move the rating.` },
  ]
  return out
}

export function Dossier({ player, onClose, onNav }: { player: Player; onClose: () => void; onNav: (p: Player) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const list = PLAYERS[player.side]
  const i = list.findIndex((x) => x.player_id === player.player_id)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"]), input')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.() }
  }, [onClose])
  useEffect(() => { ref.current?.scrollTo({ top: 0 }) }, [player.player_id])

  const cert = certainty(player)
  const desc: [string, string, string][] = player.side === 'bat'
    ? [['Strike rate', f1(player.strike_rate_press ?? 0), f1(player.strike_rate_base ?? 0)], ['Dot-ball %', f1(player.dot_pct_press), f1(player.dot_pct_base)], ['Boundary %', f1(player.boundary_pct_press), f1(player.boundary_pct_base)], ['Dismissals', String(player.dismissals_press), String(player.dismissals_base)]]
    : [['Economy (runs/over)', f2(player.economy_press ?? 0), f2(player.economy_base ?? 0)], ['Dot-ball %', f1(player.dot_pct_press), f1(player.dot_pct_base)], ['Boundary %', f1(player.boundary_pct_press), f1(player.boundary_pct_base)], ['Wides + no-balls %', f1(player.wides_nb_pct_press ?? 0), f1(Number(player.wides_nb_pct_base ?? 0))], ['Bowler wickets', String(player.wickets_press), String(player.wickets_base)]]
  const years = [2022, 2023, 2024, 2025, 2026]

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="dossier" role="dialog" aria-modal="true" aria-label={`Evidence for ${player.name}`} tabIndex={-1} ref={ref}>
        <div className="d-top">
          <div className="caps" style={{ color: 'var(--muted)' }}>{SIDE_LABEL[player.side]} · evidence dossier</div>
          <div className="nav2">
            <button className="x" aria-label="Previous player" disabled={i === 0} onClick={() => onNav(list[i - 1])}>←</button>
            <button className="x" aria-label="Next player" disabled={i === list.length - 1} onClick={() => onNav(list[i + 1])}>→</button>
            <button className="x" aria-label="Close dossier" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="d-h">
          <div className="rk" style={{ color: player.side === 'bat' ? 'var(--seam)' : 'var(--outfield)' }}>{player.rank}</div>
          <div className="portrait-wrap"><Portrait id={player.player_id} name={player.name} size={104} /></div>
          <div><h3>{player.name}</h3><div className="meta mono">player ID {player.player_id} · {player.appearances} matches in data</div><span className={`cert ${cert}`}>{CERTAINTY_LABEL[cert]}</span>{hasPhoto(player.player_id) && <div className="meta">Photo: <a href={photoCredit(player.player_id).file_url} target="_blank" rel="noreferrer">{photoCredit(player.player_id).artist.slice(0, 44) || 'Wikimedia Commons'}</a>, {photoCredit(player.player_id).license}</div>}</div>
        </div>

        <section className="d-sec" aria-labelledby="d1">
          <h4 id="d1">The numbers</h4><p className="q">Units: {UNIT[player.side]}.</p>
          <dl className="kv">
            <div><dt>High-pressure balls</dt><dd>{player.n_h}</dd></div><div><dt>Pressure matches</dt><dd>{player.m_h}</dd></div>
            <div><dt>Raw under pressure</dt><dd>{signed(player.S_h_raw)}</dd></div><div><dt>Shrunk (used)</dt><dd>{signed(player.S_h)}</dd></div>
            <div><dt>Baseline</dt><dd>{signed(player.S_l)}</dd></div><div><dt>Final rating</dt><dd>{f2(player.final)}</dd></div>
            <div><dt>Share of bootstrap resamples in top 10</dt><dd>{pct0(player.top10_prob)}</dd></div>
            <div><dt>Median rank · 90% range</dt><dd>{player.rank_median} <small>{player.rank_p05}–{player.rank_p95}</small></dd></div>
          </dl>
          <p className="src" style={{ marginTop: 10 }}>The bootstrap share measures how stable this ranking is when whole matches are resampled. It is not a prediction of the player's performance in a future match.</p>
        </section>

        <section className="d-sec" aria-labelledby="d2">
          <h4 id="d2">Why this player was selected</h4><p className="q">Each line is generated from this player's own fields in the final tables.</p>
          <ol className="why">{whySelected(player).map((w) => <li key={w.h}><b>{w.h}.</b> {w.body}</li>)}</ol>
          {cert !== 'stable' && <div className="note"><b>Uncertainty.</b> This player appears in the top 10 in {pct0(player.top10_prob)} of resamples and the 90% rank range spans {rankSpan(player)} places ({player.rank_p05}–{player.rank_p95}). The position is a best estimate, and players ranked just outside the list cannot be statistically separated from it.</div>}
        </section>

        <section className="d-sec" aria-labelledby="d3">
          <h4 id="d3">Descriptive evidence</h4><p className="q">Under high pressure versus the same player's other balls. Shown for context; these are not scored dimensions.</p>
          <table className="mini"><thead><tr><th>Measure</th><th>Under pressure</th><th>Other balls</th></tr></thead><tbody>{desc.map((d) => <tr key={d[0]}><td>{d[0]}</td><td>{d[1]}</td><td>{d[2]}</td></tr>)}</tbody></table>
        </section>

        <section className="d-sec" aria-labelledby="d4">
          <h4 id="d4">By competition and season</h4><p className="q">Raw pressure result per 100 balls. Shown only where there are at least {COMP_MIN_BALLS} high-pressure balls; small splits are too noisy to read.</p>
          <table className="mini"><thead><tr><th>Slice</th><th>Pressure balls</th><th>Raw /100 balls</th></tr></thead><tbody>
            {([['IPL', player.n_press_IPL, player.S_raw_IPL], ['T20I', player.n_press_T20I, player.S_raw_T20I], ...years.map((y) => [String(y), player[`n_press_${y}`] as number, player[`S_raw_${y}`] as number | null])] as [string, number, number | null][]).map(([s, n, v]) => (
              <tr key={s}><td>{s}</td><td>{n}</td><td>{n >= COMP_MIN_BALLS && v != null ? signed(v) : <span className="muted">too few balls</span>}</td></tr>))}
          </tbody></table>
        </section>
      </aside>
    </>
  )
}
