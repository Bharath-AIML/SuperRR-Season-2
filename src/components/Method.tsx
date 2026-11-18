import { useState } from 'react'
import { MODEL, VALIDATION, PLAYERS, ALL_PLAYERS, Player, Side, SIDE_COLOR, f1, f2, signed, pct0, WEIGHTS, ELIGIBLE, UNIT } from '../lib/data'
import { ShareBars, Calibration, Shrinkage, Contributions } from './Charts'

const wp = MODEL.wp, proj = wp.proj
const PAR = { T20I: Math.round(proj.par['0']), IPL: Math.round(proj.par['1']) }

/** Schematic of the chase formula. Leverage here is a slider, NOT model output: it shows how the two ingredients combine. */
function FormulaBench() {
  const [p, setP] = useState(0.4), [L, setL] = useState(0.6)
  const decided = p < 0.05 || p > 0.95
  const bat = L * (1 - p), bowl = L * p
  const bar = (v: number, c: string) => <div style={{ height: 22, background: 'var(--paper-2)', position: 'relative' }}><div style={{ height: '100%', width: `${Math.min(v, 1) * 100}%`, background: decided ? 'var(--paper-3)' : c, transition: 'width .2s' }} /></div>
  return (
    <div>
      <div className="slider-row">
        <label>p = P(the chasing side wins) <span className="mono">{pct0(p)}</span><input type="range" min={1} max={99} value={Math.round(p * 100)} onChange={(e) => setP(+e.target.value / 100)} aria-label="Chasing side win probability" /></label>
        <label>Leverage of the next ball (illustrative 0–1) <span className="mono">{L.toFixed(2)}</span><input type="range" min={0} max={100} value={Math.round(L * 100)} onChange={(e) => setL(+e.target.value / 100)} aria-label="Leverage of the next ball" /></label>
      </div>
      <div className="mono" style={{ fontSize: 13, marginBottom: 6 }}>Batting side: leverage × (1 − p) = {L.toFixed(2)} × {(1 - p).toFixed(2)} = <b>{bat.toFixed(2)}</b></div>{bar(bat, 'var(--seam)')}
      <div className="mono" style={{ fontSize: 13, margin: '14px 0 6px' }}>Bowling side: leverage × p = {L.toFixed(2)} × {p.toFixed(2)} = <b>{bowl.toFixed(2)}</b></div>{bar(bowl, 'var(--outfield)')}
      <p className="note" style={{ marginTop: 18, borderLeftColor: decided ? 'var(--seam)' : 'var(--flood)' }}>{decided ? <><b>Decided state.</b> p is below 5% or above 95%, so this ball can never be classed high pressure, however large the raw number looks.</> : <><b>Live state.</b> Both sides can be under pressure at once; which side feels it more depends on who is losing. Leverage is the expected absolute change in p over the next legal ball — the model computes it; here it is a slider so you can see the formula.</>}</p>
    </div>
  )
}

function FirstInnings() {
  const [comp, setComp] = useState<'T20I' | 'IPL'>('IPL'); const par = PAR[comp]
  const [proj_, setProj] = useState(150)
  const d = par - proj_
  return (
    <div>
      <div className="seg" role="group" aria-label="Competition par"><button aria-pressed={comp === 'IPL'} onClick={() => setComp('IPL')}>IPL par {PAR.IPL}</button><button aria-pressed={comp === 'T20I'} onClick={() => setComp('T20I')}>Men’s T20I par {PAR.T20I}</button></div>
      <div className="slider-row"><label>Projected final total <span className="mono">{proj_}</span><input type="range" min={100} max={260} value={proj_} onChange={(e) => setProj(+e.target.value)} aria-label="Projected final total" /></label></div>
      <div className="mono" style={{ fontSize: 14 }}>deficit = par − projection = {par} − {proj_} = <b>{signed(d, 0)}</b></div>
      <p className="note red" style={{ marginTop: 14 }}>{d > 0 ? <>Innings tracking <b>{d} runs below par</b> → pressure on the <b>batting</b> side.</> : d < 0 ? <>Innings tracking <b>{-d} runs above par</b> → pressure on the <b>bowling</b> side.</> : <>Exactly on par.</>} Pressure is the percentile of the deficit within first innings, so only the ordering matters.</p>
    </div>
  )
}

export function PressureSection() {
  const bat = VALIDATION.find((r: any) => r.perspective === 'batting side' && r.tier === 'HIGH pressure'), batO = VALIDATION.find((r: any) => r.perspective === 'batting side' && r.tier === 'other')
  const bowl = VALIDATION.find((r: any) => r.perspective === 'bowling side' && r.tier === 'HIGH pressure')
  return (
    <div className="cols"><div className="c-rail" /><div className="c-main">
      <div className="prose">
        <p>Pressure is not “the death overs”, “a high required rate”, “a close match” or “a knockout game”. A required rate of 24 with two wickets left is a lost cause, not a moment that still matters, and an evenly poised match after two overs is not tense either. We need <b>stakes</b> (can the next ball still change the result?) and <b>threat</b> (is this side in danger of losing?) — and because a chase has a target and a first innings does not, two different engines.</p>
        <p>Everything is computed from the match state <em>immediately before</em> the ball. The final result is used only as a training label, and every delivery’s pressure comes from a model that never saw that delivery’s match (out-of-fold by match).</p>
      </div>
      <div className="two" style={{ marginTop: 40 }}>
        <div className="a">
          <p className="caps" style={{ color: 'var(--seam)' }}>Engine 1 · second innings (chases)</p>
          <h3 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Leverage × threat of losing</h3>
          <p>Let <span className="mono">p = P(the chasing batting side wins)</span>. A win-probability model (AUC {f2(wp.innings2.glm_auc)}, log-loss {f2(wp.innings2.glm_logloss)} against {f2(wp.innings2.base_logloss)} for a constant) gives p before every ball. <b>Leverage</b> is how much the next legal ball can move p. The <b>threat of losing</b> is <span className="mono">1 − p</span> for the batting side and <span className="mono">p</span> for the bowling side. Raw pressure = leverage × threat. States with p below 5% or above 95% are <b>decided</b> and are never high pressure.</p>
        </div>
        <div className="b"><FormulaBench /></div>
      </div>
      <div className="two" style={{ marginTop: 56 }}>
        <div className="a">
          <p className="caps" style={{ color: 'var(--seam)' }}>Engine 2 · first innings</p>
          <h3 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Behind or ahead of par</h3>
          <p>No target, so no chase model. (A first-innings win-probability model is almost flat — AUC {f2(wp.innings1_win_prob_not_used.auc)} — so it cannot define pressure.) Instead a regression projects the runs still to come from score, wickets, balls remaining and competition (out-of-fold R² {f2(proj.r2_oof)}, mean error {f1(proj.mae_oof)} runs across {proj.n_matches} completed 20-over innings) and compares the projected total with the competition par: <b>men’s T20Is {PAR.T20I}, IPL {PAR.IPL}</b>. Reduced-over matches are excluded from this score.</p>
        </div>
        <div className="b"><FirstInnings /></div>
      </div>
      <div style={{ marginTop: 64 }} className="two">
        <div className="a">
          <p className="caps" style={{ color: 'var(--seam)' }}>One scale</p>
          <h3 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Percentile within innings type</h3>
          <p>The two raw measures mean different things, so we never add them together. Each is converted to its percentile <em>within its own innings type</em> (0–100), and the top 25% of deliveries that are not decided count as <b>high pressure</b>. Twenty and thirty per cent were tested; the lists move by two to three players (Section G).</p>
          <p>High pressure turns up in every phase — not just the death overs. It is the least common in the first-innings powerplay and most common in the death overs of the chase.</p>
        </div>
        <div className="b chart"><h3>Where do high-pressure deliveries occur?</h3><p className="reading">Share of deliveries classed high pressure, by innings and phase (powerplay = first 30% of the innings, death = last 25%).</p><ShareBars /><p className="src">source: pressure_share_by_innings_phase.csv</p></div>
      </div>

      <div style={{ marginTop: 64 }} className="two">
        <div className="a chart"><h3>Does the index separate pressure from ordinary play?</h3>
          <p className="reading">Yes — in the direction cricket says it should, using the real deliveries. Under high pressure the batting side has lost more wickets, is less likely to win, scores more slowly and loses its wicket more often.</p></div>
        <div className="b">
          <table className="mini"><thead><tr><th>Batting side, per delivery</th><th>High pressure</th><th>All other</th></tr></thead><tbody>
            <tr><td>Deliveries</td><td>{bat.balls.toLocaleString()}</td><td>{batO.balls.toLocaleString()}</td></tr>
            <tr><td>Mean wickets already lost</td><td>{bat.mean_wickets_lost}</td><td>{batO.mean_wickets_lost}</td></tr>
            <tr><td>Chasing side win probability p</td><td>{bat.mean_p_win_chase}</td><td>{batO.mean_p_win_chase}</td></tr>
            <tr><td>Runs off the bat per ball</td><td>{bat.bat_runs_per_ball}</td><td>{batO.bat_runs_per_ball}</td></tr>
            <tr><td>Batter out per 100 balls</td><td>{bat.batter_out_pct}</td><td>{batO.batter_out_pct}</td></tr>
            <tr><td>Bowling-side view: chase win probability p when bowlers are under high pressure</td><td>{bowl.mean_p_win_chase}</td><td>—</td></tr>
          </tbody></table>
          <p className="src">source: pressure_validation.csv. The bowling side is under high pressure precisely when p (the chasing side’s chance) is high: mean p = {bowl.mean_p_win_chase}.</p>
        </div>
      </div>
      <div style={{ marginTop: 56 }} className="two">
        <div className="a chart"><h3>Can the win-probability model be trusted?</h3><p className="reading">Held-out chases: predicted win probability against what actually happened. Points on the dashed diagonal are perfectly calibrated; dot size is the number of deliveries.</p></div>
        <div className="b"><Calibration /><p className="src">source: wp_diagnostics.json (innings2.calibration)</p></div>
      </div>
    </div></div>
  )
}

function BeforeAfter() {
  const all = ALL_PLAYERS
  const [id, setId] = useState(`${all[0].side}-${all[0].player_id}`)
  const p = all.find((x) => `${x.side}-${x.player_id}` === id)!
  const [pos, setPos] = useState(50)
  return (
    <div>
      <div className="slider-row"><label>Player <select value={id} onChange={(e) => setId(e.target.value)} style={{ font: 'inherit', padding: 10, minHeight: 44, border: '1.5px solid var(--ink)', background: 'var(--paper)' }}>{(['bat', 'bowl'] as Side[]).map((s) => <optgroup key={s} label={s === 'bat' ? 'Batters' : 'Bowlers'}>{PLAYERS[s].map((x) => <option key={x.player_id} value={`${x.side}-${x.player_id}`}>{x.rank}. {x.name}</option>)}</optgroup>)}</select></label></div>
      <div className="ba" style={{ ['--pos' as any]: `${pos}%` }}>
        <div className="layer"><div><div className="caps muted">Ordinary balls (baseline)</div><div className="big" style={{ color: 'var(--ink)' }}>{signed(p.S_l, 0)}</div><div className="mono" style={{ fontSize: 13 }}>{p.side === 'bat' ? 'runs above' : 'runs saved against'} expectation / 100 balls</div></div></div>
        <div className="layer top"><div><div className="caps" style={{ color: 'var(--flood)' }}>Under high pressure</div><div className="big">{signed(p.S_h_raw, 0)}</div><div className="mono" style={{ fontSize: 13 }}>raw · shrunk {signed(p.S_h, 0)} (used in rating)</div></div></div>
        <div className="handle" />
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Slide between baseline and pressure result" />
      </div>
      <p className="src">{p.name}: {p.n_h} high-pressure balls vs {'baseline over all other balls'}. Drag, or use ← → on the slider. Source: FINAL_top10 tables (S_l, S_h_raw, S_h).</p>
    </div>
  )
}

export function PerformanceSection() {
  const ch = MODEL.chronological
  return (
    <div className="cols"><div className="c-rail" /><div className="c-main">
      <div className="prose"><p>Twelve runs are not twelve runs. We therefore never ask “how many?” — we ask “<b>how many compared with what a typical player would have managed in exactly this situation?</b>” The difference is the player’s <em>residual</em>. Batters and bowlers are modelled completely separately, and the player’s identity is never a predictor, so the residual belongs to the player.</p></div>
      <ol className="plates" style={{ padding: 0 }}>
        <li><h4>Match situation</h4><p>Pressure level, innings, phase, wickets lost, batting-position group, pace vs spin, opposing team (small teams pooled).</p><span className="out">identity of the player is <b>not</b> an input</span></li>
        <li><h4>Expected outcome</h4><p>Four transparent GLMs: expected runs per ball (Poisson), dismissal probability (logistic), bowler runs conceded, bowler-credited wicket probability. Fitted out-of-fold by match.</p><span className="out">2025-26 hold-out beats a phase-only model on every outcome</span></li>
        <li><h4>Residual</h4><p>Batters: runs above expectation. Bowlers: runs <em>saved</em> against expectation. A 12-run death over in a hard spot can still be a good over.</p><span className="out">positive = better than the average player in that situation</span></li>
        <li><h4>Baseline</h4><p>The same player’s residual on all his other balls. Because the residual is situation-adjusted, a death-over specialist is not compared against powerplay balls.</p><span className="out">pressure and baseline use disjoint balls</span></li>
      </ol>
      <div className="two">
        <div className="a">
          <h3 style={{ fontSize: '1.9rem', marginBottom: 10 }}>Pressure versus baseline, one player at a time</h3>
          <p>Slide the divider. Left of it is the player’s ordinary level; right of it is what the same player did when the match was at stake. A high pressure number is not the same as a good <em>change</em> from baseline — which is why the rating has a separate component, R, for that (Section D).</p>
          <div className="note"><b>Descriptive, not scored.</b> Strike rate, boundary %, dot %, economy and extras explain <em>how</em> a result happened, but they are arithmetically linked to runs above expectation, so they carry no weight of their own. Counting them again would double-count the same scoring.</div>
        </div>
        <div className="b"><BeforeAfter /></div>
      </div>
      <p className="src" style={{ marginTop: 18 }}>Held-out check (train before 2025, test 2025–26; mean log-likelihood per ball, higher is better): batter runs {ch.bat_runs.model.toFixed(4)} vs {ch.bat_runs.naive_phase_innings.toFixed(4)} naive · batter dismissals {ch.bat_out.model.toFixed(4)} vs {ch.bat_out.naive_phase_innings.toFixed(4)} · bowler runs {ch.bowl_runs.model.toFixed(4)} vs {ch.bowl_runs.naive_phase_innings.toFixed(4)} · bowler wickets {ch.bowl_wkt.model.toFixed(4)} vs {ch.bowl_wkt.naive_phase_innings.toFixed(4)}. Source: chronological_validation.json.</p>
    </div></div>
  )
}

export function RatingSection() {
  const hb = MODEL.hyper.bat, hw = MODEL.hyper.bowl
  return (
    <div className="cols"><div className="c-rail" /><div className="c-main">
      <div className="prose"><p className="caps muted">The formula, then what the data allowed</p>
        <h3 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.8rem)', marginBottom: 14 }} className="mono">Final = 0.60·H + 0.25·R + 0.15·C</h3></div>
      <div className="two">
        <div className="a prose">
          <p><b>H — absolute pressure performance.</b> How much better than the average player in the same situation, under high pressure, after shrinkage. The largest weight: you must actually be good when it matters.</p>
          <p><b>R — pressure-specific deviation.</b> Whether the player does better or worse under pressure than his <em>own baseline</em> would predict. It stops an elite baseline being credited twice and a weak baseline being rewarded for a small decline.</p>
          <p><b>C — consistency.</b> Among matches with at least four high-pressure balls, how often was the net contribution non-negative — shrunk toward the league share — so a single huge innings cannot carry a player.</p>
          <p>Eligibility: at least <b>36 high-pressure balls in at least 5 separate matches</b> ({MODEL.n_eligible.bat} batters and {MODEL.n_eligible.bowl} bowlers qualify). All nine combinations of 24/36/48 balls × 3/5/7 matches give exactly the same top ten.</p>
        </div>
        <div className="b">
          <div className="note red"><b>What the data did <em>not</em> support.</b> We specified a wicket component (batting 65% scoring / 35% wicket-preservation; bowling 60% run-prevention / 40% wicket-taking) and tested it. The between-player variance of dismissal and wicket residuals was estimated at <b>zero</b> for both batters (τ² = {f2(hb.tau2_W_h)}) and bowlers (τ² = {f2(hw.tau2_W_h)}): differences in dismissal rate against expectation are indistinguishable from chance. It therefore shrank to zero and <b>does not influence any submitted rating</b>. In effect, H and R are run-scoring (batters) and run-prevention (bowlers) measures. Batter resilience R was also estimated at zero (τ² = {f2(hb.tau2dev_S)}), so batter ratings rest on H and C; bowler R is real (SD {f1(Math.sqrt(hw.tau2dev_S))} runs per 100 balls).</div>
          <p>That is a finding, not a bug: it means the final lists should not be described as rewarding survival or wicket-taking.</p>
        </div>
      </div>

      <div className="two" style={{ marginTop: 56 }}>
        <div className="a chart"><h3>Impressive is not the same as proven</h3><p className="reading">Each hollow ring is a player’s raw pressure result; the filled dot is the same estimate after empirical-Bayes shrinkage. With few balls the estimate is pulled hard toward the average; with hundreds of balls it hardly moves. The between-player spread of true pressure scoring is small ({f1(Math.sqrt(hb.tau2_S_h))} runs per 100 balls for batters) compared with the noise in a few hundred balls.</p>
          <p className="reading">A design-effect correction ({f2(MODEL.se.bat.de_median)}–{f2(MODEL.se.bowl.de_median)} for a typical eligible player) acknowledges that balls within one match are not independent.</p></div>
        <div className="b"><ShrinkAny /></div>
      </div>
    </div></div>
  )
}

function ShrinkAny() {
  const [side, setSide] = useState<Side>('bat')
  return <div><div className="seg" role="group" aria-label="Side"><button aria-pressed={side === 'bat'} onClick={() => setSide('bat')}>Batters</button><button aria-pressed={side === 'bowl'} onClick={() => setSide('bowl')}>Bowlers</button></div><Shrinkage side={side} /><p className="src">source: {side}_all_players_base.csv (eligible players: {ELIGIBLE[side].length})</p></div>
}

export function ContribBlock({ side }: { side: Side }) {
  return <div className="chart"><h3>What each rating is made of</h3><p className="reading">Stacked contributions to the final rating. For batters the grey R segment is absent by construction (estimated zero).</p><Contributions side={side} /><p className="src">source: FINAL_top10_{side}.csv (zH, zR, zC × 0.60 / 0.25 / 0.15; sums to the final rating)</p></div>
}
