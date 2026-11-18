import { useState } from 'react'
import { MODEL, PLAYERS, Player, Side, SENS, SIDE_LABEL, f2, signed, pct0, certainty, CERTAINTY_LABEL, COMP_MIN_BALLS } from '../lib/data'
import { PressureVsBaseline, CompSplit, SensitivityMatrix } from './Charts'
import { ContribBlock } from './Method'
import { Portrait } from './Portrait'

export function WhyTwenty({ onOpen }: { onOpen: (p: Player) => void }) {
  return (
    <div className="cols"><div className="c-rail" /><div className="c-main">
      <div className="prose"><p>Every selection can be traced to its own evidence. Open any dossier for the numbers behind H, R and C, the descriptive evidence, the competition and season splits, and an explicit statement of how uncertain that rank is. No justification here is generic: each sentence is generated from the player’s own row in the final tables.</p></div>
      <div className="two" style={{ marginTop: 28 }}>
        {(['bat', 'bowl'] as Side[]).map((s) => (
          <div key={s} className="half">
            <p className="caps" style={{ color: s === 'bat' ? 'var(--seam)' : 'var(--outfield)', borderBottom: '2px solid var(--ink)', paddingBottom: 8 }}>{SIDE_LABEL[s]}</p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {PLAYERS[s].map((p) => (
                <li key={p.player_id} style={{ borderBottom: '1px solid var(--paper-3)' }}>
                  <button onClick={() => onOpen(p)} style={{ display: 'grid', gridTemplateColumns: '38px 44px 1fr', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '13px 4px', minHeight: 44 }} aria-label={`Open evidence for ${p.name}`}>
                    <span className="mono" style={{ fontWeight: 500 }}>{String(p.rank).padStart(2, '0')}</span><Portrait id={p.player_id} name={p.name} size={44} />
                    <span><b style={{ fontFamily: 'var(--display)', fontSize: '1.2rem' }}>{p.name}</b><br /><span className="muted mono" style={{ fontSize: 12 }}>{p.n_h} balls · {p.m_h} matches · shrunk {signed(p.S_h)} · {pct0(p.top10_prob)} in top 10</span></span>
                    <span /><span /><span><span className={`cert ${certainty(p)}`}>{CERTAINTY_LABEL[certainty(p)]}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div></div>
  )
}

export function VisualEvidence({ onOpen }: { onOpen: (p: Player) => void }) {
  const [side, setSide] = useState<Side>('bat')
  const season = MODEL.season, fair = MODEL.fairness
  const sh = MODEL.split_half
  return (
    <div className="cols"><div className="c-rail" /><div className="c-main">
      <div className="results-tools"><div className="seg" role="group" aria-label="Side for charts"><button aria-pressed={side === 'bat'} onClick={() => setSide('bat')}>Batters</button><button aria-pressed={side === 'bowl'} onClick={() => setSide('bowl')}>Bowlers</button></div></div>

      <div className="two">
        <div className="a chart"><h3>Who beats their own baseline when it matters?</h3>
          <p className="reading">Each dot is one eligible {side === 'bat' ? 'batter' : 'bowler'} ({MODEL.n_eligible[side]}). Above the dotted diagonal, the player does better under pressure than normally; coloured dots are the selected ten. Most selected players sit above the line in raw terms. That is partly selection — players chosen for strong pressure results will tend to look better under pressure than at baseline — which is exactly why raw values are shrunk before they enter the rating.</p>
          <p className="src">raw values, per 100 balls vs expectation · source: {side}_all_players_base.csv</p></div>
        <div className="b"><PressureVsBaseline side={side} onOpen={onOpen} /></div>
      </div>

      <div style={{ marginTop: 64 }}><ContribBlock side={side} /></div>

      <div className="two" style={{ marginTop: 64 }}>
        <div className="a chart"><h3>Do IPL and T20I results agree?</h3>
          <p className="reading">The model includes a competition effect through the opposing team, and the average high-pressure residual is close to zero in both ({signed(fair[side].mean_resid_per100_IPL)} IPL, {signed(fair[side].mean_resid_per100_T20I)} T20I per 100 balls). But for the {fair[side].n_players_both} {side === 'bat' ? 'batters' : 'bowlers'} with enough pressure balls in both, the rank correlation between IPL and T20I pressure results is only {f2(fair[side].spearman_IPL_vs_T20I)}: one competition’s pressure sample is weak evidence. A split is drawn only with ≥ {COMP_MIN_BALLS} balls.</p>
          <p className="src">source: ipl_t20i_fairness.json; FINAL_top10_{side}.csv (S_raw_IPL, S_raw_T20I)</p></div>
        <div className="b"><CompSplit side={side} /></div>
      </div>

      <div className="two" style={{ marginTop: 64 }}>
        <div className="a chart"><h3>Does adding season effects change the lists?</h3>
          <p className="reading">We re-ran everything with season (2022–2026) fixed effects in the expected-performance models and the first-innings projection. {season[side].overlap} of ten {side === 'bat' ? 'batters' : 'bowlers'} stay; the changes are all at ranks 8–10.</p>
          <p>Out: <b>{season[side].dropped.join(', ')}</b>. In: <b>{season[side].entered.join(', ')}</b>. Rank correlation across all eligible players: {f2(season[side].spearman_all_eligible)}. We kept the main method: with five seasons, season terms partly absorb real player differences.</p>
          <p className="src">source: qa/season_sensitivity.json</p></div>
        <div className="b"><SensitivityMatrix side={side} /><p className="src">Rows: players in the submitted top 10 (bold, numbered) and the most frequent challengers. Columns: every alternative specification tested. Filled = in that configuration’s top 10. source: ranking_results.json (grid)</p></div>
      </div>

      <div style={{ marginTop: 56 }} className="note">
        <b>Does pressure performance persist?</b> Splitting each player’s matches into 2022–24 and 2025–26, the rank correlation of the absolute pressure score (H) is {f2(sh[side]['2022-24 vs 2025-26'].comp_h)} ({sh[side]['2022-24 vs 2025-26'].n} players with ≥ 24 balls in both), against {f2(sh[side]['2022-24 vs 2025-26'].S_l)} for ordinary-ball skill. A positive but modest persistence: this is why the lower places are uncertain.
      </div>
    </div></div>
  )
}

function range(side: Side, re: RegExp) { const o = SENS[side].filter((g) => re.test(g.label)).map((g) => g.overlap); return o.length ? [Math.min(...o), Math.max(...o)] : [0, 0] }
const rg = (r: number[]) => (r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`)

export function Reliability() {
  const season = MODEL.season
  const L = (re: RegExp) => `${rg(range('bat', re))} of 10 batters, ${rg(range('bowl', re))} of 10 bowlers`
  return (
    <div className="cols"><div className="c-rail" /><div className="c-main">
      <div className="prose"><p>The twenty are not equally certain, and a ranking from a finite sample is an estimate, not a truth. Overlap below counts how many of the submitted ten reappear in the top ten under an alternative specification.</p></div>
      <div className="limits" style={{ marginTop: 22 }}>
        <div><p className="tier r">Robust</p><h4>Hold under every test</h4>
          <ul><li><b>Rank 1</b> of each list: in the top 10 of 100% of bootstrap resamples (Abhishek Sharma, Jasprit Bumrah).</li>
            <li><b>Eligibility thresholds</b> (24/36/48 balls × 3/5/7 matches): {L(/^elig/)}.</li>
            <li><b>Extras and Penalty-row treatment</b>: bowler list unchanged when extras_2 runs are charged to the bowler; both lists unchanged when the single Penalty row is dropped.</li>
            <li><b>Competition effect</b>: removing a collinear IPL term left the lists identical.</li></ul></div>
        <div><p className="tier m">Moderately sensitive</p><h4>Move by one to three players</h4>
          <ul><li><b>Pressure threshold</b> (20% / 30%): {L(/^top_share=0\.(2|3)$/)}.</li>
            <li><b>Final weights</b> (H/R/C grids): {L(/^final weights/)}.</li>
            <li><b>Pressure form</b> (leverage only; threat × live): {L(/^pressure form/)}.</li>
            <li><b>Season effects</b>: {season.bat.overlap} of 10 batters, {season.bowl.overlap} of 10 bowlers.</li></ul></div>
        <div><p className="tier u">Uncertain</p><h4>Treat as best estimates</h4>
          <ul><li><b>Ranks 5–10</b>: many appear in the top 10 of only about a quarter to a half of resamples.</li>
            <li><b>Time window / competition subset</b> (2022–24, 2025–26, IPL only, T20I only): {L(/only$/)}.</li>
            <li><b>Rule-based pressure</b> (death overs or chase RRR ≥ 9): {L(/^naive/)} — the definition of pressure changes who ranks, which is why it needs to be principled.</li>
            <li><b>Assuming pressure skill equals baseline skill</b> (hierarchical variant): {L(/^hierarchical/)}.</li></ul></div>
      </div>

      <h3 style={{ fontSize: '2rem', margin: '64px 0 14px' }}>What this analysis cannot see</h3>
      <div className="limits">
        <div><h4>Not in the data</h4><ul><li>No field-placement data.</li><li>No shot trajectory or contact-quality data.</li><li>No pitch or weather variables.</li><li>Stroke and delivery-style fields are partly missing (stroke: 6,016 blanks; delivery style: 381), so they are not used for scoring.</li></ul></div>
        <div><h4>Not in the model</h4><ul><li>The IPL impact-player rule is not explicitly modelled.</li><li>Opposition is controlled at team level only — no venue or team-strength ratings.</li><li>7 chases with unverifiable DLS or recorded targets are excluded from second-innings pressure.</li></ul></div>
        <div><h4>Not enough sample</h4><ul><li>The median eligible-pool batter has 16 high-pressure balls (bowler: 30); the selected players have 126–604.</li><li>Dismissals and wickets are rare, so differences in them are not detectable: the wicket component shrank to zero.</li><li>Batter pressure-specific resilience (R) is not identifiable.</li><li>Top lists differ materially between 2022–24 and 2025–26; the rankings describe 2022–26 as a whole.</li></ul></div>
      </div>
    </div></div>
  )
}
