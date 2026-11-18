// Draws "Seam", an original cute scout boy (curly hair, round glasses, white headphones, burnt-orange hoodie)
// as two aligned 3x3 sprite sheets for page-mascot.
// directions: up-left, up, up-right, left, center, right, down-left, down, down-right
// reactions : blink, heart, sparkle, surprised, wink, bashful, sleepy, dizzy, delighted
// One body, one head origin in every cell, so nothing jumps between cells.
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CELL = 512
const OUT = fileURLToPath(new URL('../public/mascots/', import.meta.url))
mkdirSync(OUT, { recursive: true })
const INK = '#2A1710', F = (n) => n.toFixed(1)

const defs = `<defs>
  <radialGradient id="skin" cx="42%" cy="32%" r="78%"><stop offset="0" stop-color="#FFD9B8"/><stop offset=".55" stop-color="#F3B98D"/><stop offset="1" stop-color="#D98F63"/></radialGradient>
  <radialGradient id="skinS" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#EDB187"/><stop offset="1" stop-color="#C77F55"/></radialGradient>
  <radialGradient id="hair" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#B2733F"/><stop offset=".5" stop-color="#7C4524"/><stop offset="1" stop-color="#4A2713"/></radialGradient>
  <linearGradient id="hood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D2561C"/><stop offset="1" stop-color="#9C3A10"/></linearGradient>
  <radialGradient id="hoodHi" cx="35%" cy="20%" r="70%"><stop offset="0" stop-color="#F08A52" stop-opacity=".75"/><stop offset="1" stop-color="#F08A52" stop-opacity="0"/></radialGradient>
  <radialGradient id="cup" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#EDE6DA"/><stop offset="1" stop-color="#C9BFB0"/></radialGradient>
  <linearGradient id="strap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6F7B43"/><stop offset="1" stop-color="#4D5830"/></linearGradient>
  <radialGradient id="scl" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EFE7DA"/></radialGradient>
  <radialGradient id="iris" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#A5683A"/><stop offset=".7" stop-color="#6B3A1C"/><stop offset="1" stop-color="#3E200E"/></radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  <clipPath id="cellclip"><rect width="512" height="512"/></clipPath>
</defs>`

const heart = (cx, cy, s, fill) => `<path transform="translate(${F(cx)} ${F(cy)}) scale(${s})" d="M0 9 C-14 -2 -12 -14 -5 -14 C-2 -14 0 -11 0 -9 C0 -11 2 -14 5 -14 C12 -14 14 -2 0 9 Z" fill="${fill}"/>`
const star = (cx, cy, r, fill, rot = 0) => { const p = []; for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2 + rot, rr = i % 2 ? r * 0.42 : r; p.push(`${F(cx + Math.cos(a) * rr)},${F(cy + Math.sin(a) * rr)}`) } return `<polygon points="${p.join(' ')}" fill="${fill}"/>` }
const sparkle = (cx, cy, r, fill) => `<path d="M${F(cx)} ${F(cy - r)} Q${F(cx + r * .18)} ${F(cy - r * .18)} ${F(cx + r)} ${F(cy)} Q${F(cx + r * .18)} ${F(cy + r * .18)} ${F(cx)} ${F(cy + r)} Q${F(cx - r * .18)} ${F(cy + r * .18)} ${F(cx - r)} ${F(cy)} Q${F(cx - r * .18)} ${F(cy - r * .18)} ${F(cx)} ${F(cy - r)}Z" fill="${fill}"/>`
const spiral = (cx, cy, r) => { let d = ''; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * 2.6 * Math.PI * 2; d += `${i ? 'L' : 'M'}${F(cx + Math.cos(a) * r * t)} ${F(cy + Math.sin(a) * r * t)} ` } return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` }

function eye(cx, cy, mode, px, py) {
  const R = mode === 'wide' ? 48 : 44
  const rim = `<circle cx="${F(cx)}" cy="${F(cy)}" r="${R + 4}" fill="#0F0805"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${R - 4}" fill="url(#scl)"/>`
  if (mode === 'closed') return `<circle cx="${F(cx)}" cy="${F(cy)}" r="${R + 4}" fill="none" stroke="#0F0805" stroke-width="8"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${R - 4}" fill="#F7DCC2"/><path d="M${F(cx - 28)} ${F(cy + 2)} Q${F(cx)} ${F(cy + 22)} ${F(cx + 28)} ${F(cy + 2)}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`
  if (mode === 'happy') return `<circle cx="${F(cx)}" cy="${F(cy)}" r="${R + 4}" fill="none" stroke="#0F0805" stroke-width="8"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${R - 4}" fill="#F7DCC2"/><path d="M${F(cx - 28)} ${F(cy + 10)} Q${F(cx)} ${F(cy - 26)} ${F(cx + 28)} ${F(cy + 10)}" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`
  const ir = mode === 'wide' ? 20 : 25, pr = mode === 'wide' ? 8 : 13, ix = cx + px, iy = cy + py
  let inner
  if (mode === 'spiral') inner = spiral(cx, cy, R - 12)
  else {
    inner = `<circle cx="${F(ix)}" cy="${F(iy)}" r="${ir}" fill="url(#iris)"/>`
    if (mode === 'heart') inner += heart(ix, iy + 1, 1.5, '#E2354A')
    else if (mode === 'star') inner += `<circle cx="${F(ix)}" cy="${F(iy)}" r="${ir - 2}" fill="#3E200E"/>` + star(ix, iy, 14, '#FFFFFF')
    else inner += `<circle cx="${F(ix)}" cy="${F(iy)}" r="${pr}" fill="#150A05"/><circle cx="${F(ix - 8)}" cy="${F(iy - 9)}" r="6" fill="#fff"/><circle cx="${F(ix + 9)}" cy="${F(iy + 9)}" r="2.8" fill="#fff" opacity=".85"/>`
  }
  let lid = ''
  if (mode === 'sleepy') lid = `<path d="M${F(cx - R + 4)} ${F(cy + 2)} A${R - 4} ${R - 4} 0 0 1 ${F(cx + R - 4)} ${F(cy + 2)} Z" fill="#EFB487"/><path d="M${F(cx - R + 6)} ${F(cy + 2)} L${F(cx + R - 6)} ${F(cy + 2)}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
  return rim + inner + lid + `<path d="M${F(cx - 26)} ${F(cy - 24)} A32 32 0 0 1 ${F(cx + 4)} ${F(cy - 33)}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>`
}

function curl(x, y, r) { return `<circle cx="${F(x)}" cy="${F(y)}" r="${r}" fill="url(#hair)"/><path d="M${F(x - r * .5)} ${F(y - r * .1)} q${F(r * .3)} ${F(-r * .6)} ${F(r * .8)} ${F(-r * .3)}" fill="none" stroke="#C48650" stroke-width="3" stroke-linecap="round" opacity=".55"/>` }

function body() {
  return `
  <ellipse cx="256" cy="498" rx="170" ry="16" fill="#000" opacity=".18" filter="url(#soft)"/>
  <!-- hoodie shoulders -->
  <path d="M70 520 C70 436 128 388 256 384 C384 388 442 436 442 520 Z" fill="url(#hood)"/>
  <path d="M70 520 C70 436 128 388 256 384 C384 388 442 436 442 520 Z" fill="url(#hoodHi)"/>
  <!-- backpack straps -->
  <path d="M142 412 C140 450 146 490 150 520 L190 520 C186 486 184 450 190 400 Z" fill="url(#strap)"/>
  <path d="M370 412 C372 450 366 490 362 520 L322 520 C326 486 328 450 322 400 Z" fill="url(#strap)"/>
  <!-- hood collar + neck -->
  <path d="M170 392 C196 430 316 430 342 392 C318 380 194 380 170 392 Z" fill="#B8451A"/>
  <path d="M200 402 C224 424 288 424 312 402" fill="none" stroke="#7E2E0D" stroke-width="5" stroke-linecap="round" opacity=".5"/>
  <!-- drawstrings -->
  <path d="M228 418 L224 478" stroke="#FFF" stroke-width="7" stroke-linecap="round"/><path d="M284 418 L288 478" stroke="#FFF" stroke-width="7" stroke-linecap="round"/>
  <circle cx="224" cy="482" r="6" fill="#fff"/><circle cx="288" cy="482" r="6" fill="#fff"/>
  <!-- small stitched-seam patch: the only cricket nod -->
  <g transform="translate(256 500)"><circle r="22" fill="#B92E1B"/><path d="M-14 -14 Q0 -2 -14 14 M14 -14 Q0 -2 14 14" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round"/></g>`
}

function head({ dx = 0, dy = 0, eyes = ['open', 'open'], look = null, mouth = 'smile', blush = 0.35, brows = 'soft', extra = '' }) {
  const hx = dx * 12, hy = dy * 8, rot = dx * 3
  const fx = dx * 26, fy = dy * 15 // facial parallax
  const px = look ? look[0] : dx * 11, py = look ? look[1] : dy * 9
  const ecx = 256 + fx, ecy = 250 + fy
  const sx = 1 - Math.abs(dx) * 0.03
  const hairX = -dx * 5, hairY = -dy * 3
  const farL = dx > 0 ? 1 - 0.28 * dx : 1, farR = dx < 0 ? 1 + 0.28 * dx : 1 // far ear-cup shrinks when turned
  const mouthEl = {
    smile: `<path d="M${F(ecx - 20)} ${F(ecy + 70)} Q${F(ecx)} ${F(ecy + 88)} ${F(ecx + 20)} ${F(ecy + 70)}" fill="none" stroke="#8E3B2A" stroke-width="6" stroke-linecap="round"/>`,
    open: `<path d="M${F(ecx - 18)} ${F(ecy + 66)} Q${F(ecx)} ${F(ecy + 112)} ${F(ecx + 18)} ${F(ecy + 66)} Z" fill="#7A2A1E"/><path d="M${F(ecx - 11)} ${F(ecy + 88)} Q${F(ecx)} ${F(ecy + 78)} ${F(ecx + 11)} ${F(ecy + 88)}" fill="#E8776B"/>`,
    big: `<path d="M${F(ecx - 28)} ${F(ecy + 62)} Q${F(ecx)} ${F(ecy + 112)} ${F(ecx + 28)} ${F(ecy + 62)} Z" fill="#7A2A1E"/><path d="M${F(ecx - 28)} ${F(ecy + 62)} Q${F(ecx)} ${F(ecy + 72)} ${F(ecx + 28)} ${F(ecy + 62)} L${F(ecx + 25)} ${F(ecy + 70)} Q${F(ecx)} ${F(ecy + 78)} ${F(ecx - 25)} ${F(ecy + 70)}Z" fill="#fff"/>`,
    o: `<ellipse cx="${F(ecx)}" cy="${F(ecy + 82)}" rx="11" ry="14" fill="#7A2A1E"/>`,
    flat: `<path d="M${F(ecx - 14)} ${F(ecy + 76)} L${F(ecx + 14)} ${F(ecy + 76)}" stroke="#8E3B2A" stroke-width="6" stroke-linecap="round"/>`,
  }[mouth]
  const browEl = brows === 'up' ? `<path d="M${F(ecx - 90)} ${F(ecy - 66)} Q${F(ecx - 62)} ${F(ecy - 84)} ${F(ecx - 34)} ${F(ecy - 68)} M${F(ecx + 34)} ${F(ecy - 68)} Q${F(ecx + 62)} ${F(ecy - 84)} ${F(ecx + 90)} ${F(ecy - 66)}" fill="none" stroke="#4A2713" stroke-width="8" stroke-linecap="round"/>`
    : brows === 'shy' ? `<path d="M${F(ecx - 88)} ${F(ecy - 58)} Q${F(ecx - 62)} ${F(ecy - 70)} ${F(ecx - 36)} ${F(ecy - 62)} M${F(ecx + 36)} ${F(ecy - 62)} Q${F(ecx + 62)} ${F(ecy - 70)} ${F(ecx + 88)} ${F(ecy - 58)}" fill="none" stroke="#4A2713" stroke-width="7" stroke-linecap="round"/>`
      : `<path d="M${F(ecx - 88)} ${F(ecy - 60)} Q${F(ecx - 62)} ${F(ecy - 74)} ${F(ecx - 34)} ${F(ecy - 62)} M${F(ecx + 34)} ${F(ecy - 62)} Q${F(ecx + 62)} ${F(ecy - 74)} ${F(ecx + 88)} ${F(ecy - 60)}" fill="none" stroke="#4A2713" stroke-width="8" stroke-linecap="round"/>`
  const blushEl = blush ? `<ellipse cx="${F(ecx - 86)}" cy="${F(ecy + 52)}" rx="22" ry="13" fill="#F0705A" opacity="${blush}"/><ellipse cx="${F(ecx + 86)}" cy="${F(ecy + 52)}" rx="22" ry="13" fill="#F0705A" opacity="${blush}"/>` : ''
  // curls: crown + fringe
  const crown = [[170, 150, 34], [212, 118, 38], [262, 108, 40], [310, 118, 38], [350, 150, 34], [138, 196, 28], [374, 196, 28], [196, 160, 30], [256, 150, 34], [318, 160, 30], [232, 136, 30], [290, 138, 30]]
    .map(([x, y, r]) => curl(x + hairX, y + hairY, r)).join('')
  return `
  <g transform="translate(${F(hx)} ${F(hy)}) rotate(${F(rot)} 256 400)">
    <!-- neck -->
    <path d="M214 330 L214 396 C236 412 276 412 298 396 L298 330 Z" fill="url(#skinS)"/>
    <!-- ears -->
    <ellipse cx="${F(138 + fx * 0.3)}" cy="262" rx="20" ry="28" fill="url(#skin)"/><ellipse cx="${F(374 + fx * 0.3)}" cy="262" rx="20" ry="28" fill="url(#skin)"/>
    <!-- head -->
    <g transform="translate(256 240) scale(${F(sx)} 1) translate(-256 -240)"><ellipse cx="256" cy="246" rx="124" ry="118" fill="url(#skin)"/>
    <ellipse cx="256" cy="246" rx="124" ry="118" fill="none" stroke="rgba(120,60,30,.25)" stroke-width="3"/></g>
    <!-- hair -->
    ${crown}
    <!-- headphone band + cups -->
    <path d="M${F(128 + fx * 0.3)} 252 C${F(116 + fx * 0.3)} 120 ${F(196)} 66 ${F(256 + hairX)} 64 C${F(316)} 66 ${F(396 + fx * 0.3)} 120 ${F(384 + fx * 0.3)} 252" fill="none" stroke="#F4EEE3" stroke-width="16" stroke-linecap="round"/>
    <path d="M${F(128 + fx * 0.3)} 252 C${F(116 + fx * 0.3)} 120 ${F(196)} 66 ${F(256 + hairX)} 64" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7" transform="translate(0 -2)"/>
    <g transform="translate(${F(124 + fx * 0.3)} 262) scale(${F(farL)} 1)"><ellipse rx="30" ry="46" fill="url(#cup)"/><ellipse rx="16" ry="30" cx="-3" fill="#D9CFBF"/><ellipse rx="8" ry="16" cx="-4" cy="-6" fill="#fff" opacity=".6"/></g>
    <g transform="translate(${F(388 + fx * 0.3)} 262) scale(${F(farR)} 1)"><ellipse rx="30" ry="46" fill="url(#cup)"/><ellipse rx="16" ry="30" cx="3" fill="#D9CFBF"/><ellipse rx="8" ry="16" cx="2" cy="-6" fill="#fff" opacity=".6"/></g>
    ${blushEl}
    ${browEl}
    <!-- glasses -->
    <path d="M${F(ecx - 18)} ${F(ecy - 4)} Q${F(ecx)} ${F(ecy - 16)} ${F(ecx + 18)} ${F(ecy - 4)}" fill="none" stroke="#0F0805" stroke-width="7" stroke-linecap="round"/>
    ${eye(ecx - 62, ecy, eyes[0], px, py)}
    ${eye(ecx + 62, ecy, eyes[1], px, py)}
    <!-- nose -->
    <path d="M${F(ecx - 6)} ${F(ecy + 38)} Q${F(ecx)} ${F(ecy + 48)} ${F(ecx + 8)} ${F(ecy + 40)}" fill="none" stroke="#C47A52" stroke-width="5" stroke-linecap="round"/>
    ${mouthEl}
    ${extra}
  </g>`
}

const cell = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${CELL}" height="${CELL}">${defs}<g clip-path="url(#cellclip)">${body()}${inner}</g></svg>`
const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
const directionCells = DIRS.map(([dx, dy]) => cell(head({ dx, dy })))
const z = (x, y, s, o = 1) => `<text x="${x}" y="${y}" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="${s}" fill="#fff" opacity="${o}">z</text>`
const reactionCells = [
  cell(head({ eyes: ['closed', 'closed'] })),
  cell(head({ eyes: ['heart', 'heart'], look: [0, 0], mouth: 'big', blush: 0.5, extra: heart(86, 96, 2.2, '#fff') + heart(430, 120, 1.5, '#fff') })),
  cell(head({ eyes: ['star', 'star'], look: [0, 0], mouth: 'big', extra: sparkle(84, 100, 26, '#fff') + sparkle(436, 84, 18, '#fff') + sparkle(452, 176, 12, '#FFE9D6') })),
  cell(head({ eyes: ['wide', 'wide'], look: [0, -1], mouth: 'o', brows: 'up', blush: 0.15, extra: `<path d="M74 150 l-26 -10 M80 192 l-30 0 M438 150 l26 -10 M432 192 l30 0" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` })),
  cell(head({ eyes: ['open', 'closed'], look: [4, 2], mouth: 'big', extra: sparkle(444, 170, 14, '#fff') })),
  cell(head({ eyes: ['open', 'open'], look: [-14, 14], mouth: 'smile', blush: 0.75, brows: 'shy' })),
  cell(head({ eyes: ['sleepy', 'sleepy'], look: [0, 6], mouth: 'flat', blush: 0.2, brows: 'shy', extra: z(404, 96, 40) + z(432, 66, 28, .8) + z(454, 44, 20, .6) })),
  cell(head({ eyes: ['spiral', 'spiral'], mouth: 'o', brows: 'up', extra: star(104, 86, 15, '#fff', 0.3) + star(410, 76, 12, '#fff', 0.8) + star(256, 36, 12, '#fff') })),
  cell(head({ eyes: ['happy', 'happy'], mouth: 'big', blush: 0.6, extra: sparkle(90, 120, 20, '#fff') + sparkle(424, 108, 24, '#fff') })),
]
async function sheet(cells, name) {
  const bufs = await Promise.all(cells.map((s) => sharp(Buffer.from(s)).png().toBuffer()))
  const img = sharp({ create: { width: CELL * 3, height: CELL * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(bufs.map((input, i) => ({ input, left: (i % 3) * CELL, top: Math.floor(i / 3) * CELL })))
  await img.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(OUT + name + '.webp')
  await img.clone().flatten({ background: '#E8602B' }).png().toFile(OUT + name + '.preview.png')
}
writeFileSync(OUT + 'seam-center.svg', directionCells[4])
await sheet(directionCells, 'seam-directions'); await sheet(reactionCells, 'seam-reactions')
console.log('sprites written to', OUT)
