import { useCallback, useEffect, useRef, useState } from 'react'
import { Landing } from './components/Landing'
import { Analysis } from './components/Analysis'
import { Dossier } from './components/Dossier'
import { ALL_PLAYERS, Player, playerById } from './lib/data'

type Route = { page: 'landing' | 'analysis'; section?: string; player?: Player }
function parse(): Route {
  const h = location.hash.replace(/^#\/?/, '')
  const [a, b, c] = h.split('/')
  if (a === 'player') { const p = ALL_PLAYERS.find((x) => String(x.player_id) === b && (!c || x.side === c)) ?? playerById(Number(b)); return { page: 'analysis', player: p } }
  if (a === 'analysis') return { page: 'analysis', section: b }
  return { page: 'landing' }
}

export function App() {
  const [route, setRoute] = useState<Route>(parse)
  const flood = useRef<HTMLDivElement>(null)
  useEffect(() => { const on = () => setRoute(parse()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on) }, [])
  useEffect(() => { document.body.classList.toggle('on-paper', route.page === 'analysis'); document.body.classList.toggle('on-orange', route.page === 'landing') }, [route.page])
  useEffect(() => {
    if (route.page === 'analysis' && route.section) setTimeout(() => document.getElementById(route.section!)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }), 30)
    if (route.page === 'landing') window.scrollTo(0, 0)
  }, [route.page, route.section])

  // Landing -> analysis: a floodlight switches on from the click point (instant under reduced motion).
  const enter = useCallback((e: React.MouseEvent | React.KeyboardEvent, section?: string) => {
    const go = () => { location.hash = section ? `#/analysis/${section}` : '#/analysis'; window.scrollTo(0, 0) }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = flood.current
    if (reduce || !el || !('animate' in el)) { go(); return }
    const x = 'clientX' in e ? e.clientX : window.innerWidth / 2, y = 'clientY' in e ? e.clientY : window.innerHeight / 2
    el.style.setProperty('--x', `${x || window.innerWidth / 2}px`); el.style.setProperty('--y', `${y || window.innerHeight / 2}px`)
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40
    const anim = el.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }], { duration: 640, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' })
    anim.onfinish = () => { go(); requestAnimationFrame(() => { anim.cancel() }) }
  }, [])

  const openPlayer = useCallback((p: Player) => { history.pushState(null, '', `#/player/${p.player_id}/${p.side}`); setRoute({ page: 'analysis', player: p, section: route.section }) }, [route.section])
  const closePlayer = useCallback(() => { history.pushState(null, '', '#/analysis'); setRoute({ page: 'analysis' }) }, [])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="flood" ref={flood} aria-hidden />
      {route.page === 'landing' ? <Landing onEnter={enter} /> : <Analysis onOpen={openPlayer} onHome={() => { location.hash = '#/' }} />}
      {route.player && <Dossier player={route.player} onClose={closePlayer} onNav={openPlayer} />}
    </>
  )
}
