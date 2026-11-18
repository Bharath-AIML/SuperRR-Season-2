# DESIGN.md — The Pressure Atlas

An independent analysis site for *SupeRR Selector Season 2 · Round 1*. Not an official franchise product; no franchise marks are used.

## 1. Concept
**"The scorer's notebook, read under floodlights."**
Two rooms. The **landing** is a flat, minimal orange field with white uppercase type and one character (Seam, a curly-haired scout boy in headphones and round glasses) who watches you. The **analysis** is the scorebook: warm paper, hairline rules, margin numerals, ink-stamped numbers. Entering the analysis is a circle of paper expanding from the CTA across the orange. The metaphor carries the content: pressure is the dark; evidence is the page you read it on.

Research (used as study, not copied): the page-mascot demo (one character, huge calm whitespace, mono title, a character that *notices* you); the warm-orange 3D character reference (single warm light source, soft material, character as emotional anchor); Swiss/International editorial grids (hard left alignment, numbered margins, asymmetry); data-journalism print charts (direct labels, no legends where avoidable, hairlines instead of boxes). Rejected: glass, neon, gradient-on-dark dashboards, uniform card grids, KPI-tile rows, pill clusters.

## 2. Colour (exact)
| Token | Hex | Use |
|---|---|---|
| `--orange` | `#E8602B` | **landing ground** (flat, with one soft lighter centre `#F2733A` → edge `#D24F1C`), primary accent, focus ring |
| `--orange-deep` | `#C94A17` | landing edge / overscroll |
| `--ink` | `#14110E` | text on paper, dark surfaces |
| `--paper` | `#F1E9D7` | analysis ground |
| `--paper-2` / `--paper-3` | `#E7DDC6` / `#D6C9AB` | rules, bands, axes |
| `--muted` | `#6A5E50` | secondary text (AA on paper) |
| `--seam` | `#D4501B` | **batting** (deeper orange for contrast on paper) |
| `--outfield` | `#1C5148` | **bowling** |
Landing type is **white** on orange; no yellow/amber anywhere. Uncertainty is shown with an orange-brown hatch (`#9A3C10`) plus a text label, never colour alone. The grey `#A59780` marks the R (deviation) component in stacked charts.

## 3. Typography
- **Display — Fraunces (variable)**, weights 300–900, optical size auto. Headlines in 600–800 tight (-0.02em), italic for emphasis words. Giant rank numerals 800 at 8–16rem, `font-variant-numeric: lining-nums`.
- **Text/UI — Schibsted Grotesk (variable)**, 400–700; 17px/1.6 body, 13px caps labels with +0.08em tracking.
- **Data — IBM Plex Mono**, 400/500, tabular figures for every number in tables and charts.
Scale (rem): 0.75 / 0.8125 / 1 / 1.125 / 1.5 / 2.25 / 3.5 / 5.5 / 9 / 14. Measure ≤ 62ch for prose.

## 4. Grid & spacing
12 columns, max 1360px, gutter 24px (16px mobile), page margin `clamp(16px, 4vw, 56px)`. A persistent **left margin rail** (col 1) carries section numerals (`A`–`G`) and sticky captions; content sits in cols 2–12, deliberately asymmetric (prose 5–6 cols, evidence 7–8 cols). Spacing unit 8px; section rhythm 144px desktop / 88px mobile. No nested cards.

## 5. Materials
Paper: flat `--paper` with a 2% SVG-noise grain (data-URI, static). Ruling: 1px `--paper-3` lines, 4px `--ink` top rules for section heads ("scorebook header"). Shadows: none on paper; only the mascot has a soft contact shadow. No blur, no gradients except the landing's single radial floodlight (amber → transparent) and the mascot's own shading.

## 6. Components
- **Ranking table** (editorial): rank numeral | name (display) | rating bar with bootstrap interval whisker | key counts in mono. Rows separated by hairlines; hovered/focused row inks to `--ink` ground. #1 occupies a hero block; uncertainty shown beside every row, never hidden.
- **Interval whisker**: line = 90% bootstrap rank range, dot = median; amber hatch when range spans > 25 ranks.
- **Teardown steps**: numbered plates connected by a drawn line; each plate shows the *real* output of that step.
- **Before/after slider**: baseline vs pressure for one player (handle is keyboard-operable, ←/→).
- **Stat query**: single mono input with preset chips; answers render as small typeset tables with the query's interpretation stated.
- **Player dossier**: a right-hand sheet (desktop) / full-screen sheet (mobile), focus-trapped, Esc closes, URL hash `#/player/6281`.

## 7. Chart language
Direct labels over legends; axes as hairlines with ticks every nice interval; units always stated ("runs per 100 balls vs expectation"); zero line drawn in ink; bat = red, bowl = green, amber hatch = uncertain; grey = other players. Every chart has: a question as title, a one-line reading, the data source file in mono. Tooltips only where a point identity is otherwise unreadable.

## 8. Motion
Principles: motion explains. (1) Floodlight reveal at the landing→analysis transition (600ms, ease-out, circle clip-path from click point). (2) Bars/intervals draw once on first view (500ms, staggered 30ms). (3) Dossier slides in (240ms). (4) Mascot: native page-mascot gaze + squash; extra slow idle "breath" via CSS only on the shadow. All motion off under `prefers-reduced-motion` (reveals become instant, mascot idle stops; click reactions remain as discrete expression swaps).

## 9. States & accessibility
Focus ring: 3px `--flood` outline + 2px `--ink` offset, never removed. Hover on interactive text: underline thickens to 3px in `--seam`. Hit targets ≥ 44px. Semantic landmarks, one `h1`, ordered headings, tables use real `<table>`, charts have `role="img"` + text summary + data table fallback (`<details>`). Colour is never the only signal (shape/hatch/labels). Keyboard: skip link, all dossiers/sliders/queries operable. Touch: mascot static idle with tap reactions.

## 10. Responsive
≥1100px: rail + two-column evidence. 700–1099: rail collapses to inline numerals, single column, charts full width. <700: tables become stacked ledger rows; dossier full-screen; mascot scales to 70vw (max 340px). No horizontal overflow at 360px.

## 11. Voice
Plain, specific, sceptical. Say what the data supports and what it does not. Numbers always attach to what they are ("runs per 100 balls above expectation"), never bare.

## 12. Mascot — "Cap"
The free character **Cap** (red cap, brown hair, green hoodie) from koboyo.com/page-mascot, used through the official `page-mascot` component (MIT) with its two 3×3 sheets in `public/mascots/` (source copies in `charcter_img/`). The sheets are re-sampled 3x (Lanczos + light sharpening) by `scripts/upscale_cap.mjs`; originals stay untouched in `charcter_img/`. It replaces the earlier hand-drawn characters, which were not of sufficient quality. The Cap sheets are 360 px per cell, so the landing caps its display size to keep it crisp.

## 13. Player portraits
Portraits come from Wikimedia Commons only where a freely licensed image exists (`scripts/fetch_players*.py`, credits in `src/data/photo_credits.json`, shown in the footer and dossier). Players without one show an orange monogram; no portrait is ever guessed, scraped from press sites, or generated.
