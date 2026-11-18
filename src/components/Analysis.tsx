import { useEffect, useState } from 'react'
import { Player, Side, PROVENANCE } from '../lib/data'
import { Results, AskTheData } from './Results'
import { PressureSection, PerformanceSection, RatingSection } from './Method'
import { WhyTwenty, VisualEvidence, Reliability } from './Evidence'
import { Cap } from './Mascot'
import credits from '../data/photo_credits.json'
import { ALL_PLAYERS } from '../lib/data'

const SECTIONS: { id: string; letter: string; nav: string; title: JSX.Element; dek?: string }[] = [
  { id: 'results', letter: 'A', nav: 'Results', title: <>The ten who <em>deliver</em></>, dek: 'Two lists, ranked 1 to 10, straight from the submitted rankings file — with the uncertainty next to every name.' },
  { id: 'pressure', letter: 'B', nav: 'Pressure', title: <>What is <em>pressure</em>?</>, dek: 'Not death overs, not a fixed required rate. Two engines, one scale, built only from the state before each ball.' },
  { id: 'performance', letter: 'C', nav: 'Performance', title: <>Measuring a player against <em>the situation</em></>, dek: 'Expected performance in the same situation, the residual, and the player’s own baseline.' },
  { id: 'rating', letter: 'D', nav: 'Reliability', title: <>Who is <em>reliable</em>?</>, dek: 'One formula, three components — and a finding about what the data would not support.' },
  { id: 'why', letter: 'E', nav: 'Why these 20', title: <>Why <em>this</em> player?</>, dek: 'Open any selected player for the evidence behind their place.' },
  { id: 'evidence', letter: 'F', nav: 'Evidence', title: <>Visual <em>evidence</em></>, dek: 'Each chart answers one question about the model or the players.' },
  { id: 'limits', letter: 'G', nav: 'Certainty', title: <>What holds, what moves, what <em>we cannot see</em></>, dek: 'Robust, moderately sensitive and uncertain findings, and the limits of the data.' },
  { id: 'ask', letter: '↳', nav: 'Ask the data', title: <>Ask the <em>dataset</em></>, dek: 'Deterministic questions over the published tables. No AI, no network.' },
]

export function Analysis({ onOpen, onHome }: { onOpen: (p: Player) => void; onHome: () => void }) {
  const [side, setSide] = useState<Side>('bat')
  const [cur, setCur] = useState('results')
  useEffect(() => {
    const io = new IntersectionObserver((es) => { es.forEach((e) => e.isIntersecting && setCur(e.target.id)) }, { rootMargin: '-45% 0px -50% 0px' })
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); el && io.observe(el) })
    return () => io.disconnect()
  }, [])
  const body: Record<string, JSX.Element> = {
    results: <div className="cols"><div className="c-rail" /><div className="c-main"><Results side={side} setSide={setSide} onOpen={onOpen} /></div></div>,
    pressure: <PressureSection />, performance: <PerformanceSection />, rating: <RatingSection />, why: <WhyTwenty onOpen={onOpen} />,
    evidence: <VisualEvidence onOpen={onOpen} />, limits: <Reliability />, ask: <div className="cols"><div className="c-rail" /><div className="c-main"><AskTheData /></div></div>,
  }
  return (
    <div className="paper">
      <header className="topbar"><div className="topbar-in">
        <button className="brand" onClick={onHome} aria-label="Back to the landing page"><span className="dot" aria-hidden />The Pressure Atlas</button>
        <nav className="nav" aria-label="Sections">{SECTIONS.map((s) => <a key={s.id} href={`#/analysis/${s.id}`} aria-current={cur === s.id} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView(); history.replaceState(null, '', `#/analysis/${s.id}`) }}><b>{s.letter}</b>{s.nav}</a>)}</nav>
      </div></header>
      <main id="main" className="wrap">
        <div style={{ paddingTop: 'clamp(40px,6vw,88px)' }} className="sec-head" role="presentation">
          <div className="letter caps">Analysis</div>
          <h1 style={{ gridColumn: '2 / span 10', fontSize: 'clamp(2.4rem, 6.4vw, 6rem)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: .95 }}>Twenty players, one question: <em style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--seam)' }}>who stays reliable under pressure?</em></h1>
          <p className="dek" style={{ gridColumn: '2 / span 6', marginTop: 18, fontSize: '1.12rem' }}>An independent analysis of the official competition data pack: IPL 2022–26 and men’s T20Is 2022–26, 194,014 deliveries, 853 matches. The rankings are the destination; the methodology is the proof.</p>
        </div>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="sec" style={s.id === 'results' ? { paddingTop: 24 } : undefined} aria-labelledby={`h-${s.id}`}>
            <div className="sec-head"><div className="letter">{s.letter}</div><h2 id={`h-${s.id}`}>{s.title}</h2>{s.dek && <p className="dek">{s.dek}</p>}</div>
            {body[s.id]}
          </section>
        ))}
      </main>
      <footer className="footer"><div className="wrap">
        <div className="f1"><h3 style={{ fontSize: '2rem', marginBottom: 14 }}>The ranking is an estimate, not a verdict.</h3><p>The Pressure Atlas is an independent analysis built from the official SupeRR Selector Season 2 data pack. It is not an official product of any franchise, uses no franchise branding, and every number shown is read from the submitted outputs.</p></div>
        <div className="f2"><p className="caps" style={{ color: 'var(--flood)' }}>Provenance</p><p className="mono" style={{ fontSize: 12.5 }}>SUBMISSION_rankings.csv · sha256 {PROVENANCE['SUBMISSION_rankings.csv']}…<br />SupeRR_Round1_Methodology_Report.pdf · sha256 {PROVENANCE['SupeRR_Round1_Methodology_Report.pdf']}…</p><details className="credits"><summary>Player photo credits ({Object.keys(credits).length} of 20)</summary><p style={{ fontSize: 12.5 }}>Portraits are from Wikimedia Commons under the licences shown; players without a freely licensed portrait show initials.</p><ul style={{ paddingLeft: 18 }}>{ALL_PLAYERS.filter((p) => (credits as any)[String(p.player_id)]).map((p) => { const c = (credits as any)[String(p.player_id)]; return <li key={p.player_id}>{p.name}: <a href={c.file_url} target="_blank" rel="noreferrer">{c.artist.slice(0, 50) || 'Wikimedia Commons'}</a>, {c.license}</li> })}</ul></details>
          <p style={{ fontSize: 13 }}>Mascot “Cap” is a free character from koboyo.com/page-mascot; cursor behaviour by the MIT-licensed page-mascot component.</p></div>
      </div></footer>
      <div className="railmascot" aria-hidden={false}><Cap size={86} label="Cap" /></div>
    </div>
  )
}
