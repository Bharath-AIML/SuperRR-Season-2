import { Cap } from './Mascot'

export function Landing({ onEnter }: { onEnter: (e: React.MouseEvent | React.KeyboardEvent, section?: string) => void }) {
  const fine = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches
  return (
    <main className="landing" id="main">
      <header className="l-top">
        <span className="mark">The Pressure Atlas</span>
        <span className="mid">{fine ? 'Cap follows your cursor — give it a poke' : 'Tap Cap to say hello'}</span>
      </header>
      <div className="l-stage"><div className="l-mascot"><Cap size={560} label="Cap, the scout" /></div></div>
      <div className="l-bottom">
        <h1>When the game<br />tightens, who<br />delivers?</h1>
        <div className="l-side">
          <p>194,014 deliveries, pressure defined ball by ball: the ten batters and ten bowlers who stay good when it matters — and how sure we really are.</p>
          <div className="row">
            <a className="pill" href="#/analysis" onClick={(e) => { e.preventDefault(); onEnter(e) }}>Explore the analysis <span className="arr" aria-hidden>→</span></a>
            <a className="pill ghost" href="#/analysis/pressure" onClick={(e) => { e.preventDefault(); onEnter(e, 'pressure') }}>Methodology</a>
          </div>
        </div>
      </div>
      <footer className="l-foot"><span>SupeRR Selector · Season 2 · Round 1 · IPL + men’s T20I, 2022–26</span><span>Independent analysis of the official data pack. Not an official franchise product.</span></footer>
    </main>
  )
}
