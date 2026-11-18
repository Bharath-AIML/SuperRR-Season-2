# QA log

**Environment:** Chromium 131 (Playwright), Node 18, production build served by `vite preview`. Last run: all green.

| Check | Method | Result |
|---|---|---|
| Data mapping = submitted CSV (10 unique batters / 10 bowlers, ranks 1–10, IDs, names) | vitest | pass |
| Final rating = 0.60 zH + 0.25 zR + 0.15 zC for all 20; batter R = 0; eligibility floor | vitest | pass |
| Query engine (compare, ranking by metric, two "Sharma"s, eligible counts 253/237) | vitest | pass |
| Mascot gaze: all 8 directions + re-centre; click reaction; 4 rapid pokes → dizzy | Playwright | pass |
| Touch device: tracking off, stays centred, no overflow | Playwright | pass |
| `prefers-reduced-motion`: transition instant, navigation works | Playwright | pass |
| CTA (keyboard + mouse) → analysis; "Understand the methodology" → Pressure section | Playwright | pass |
| All 8 nav anchors land on their section | Playwright | pass |
| Batter/bowler switch; sorting by pressure balls and stability | Playwright | pass |
| All 20 dossiers open (5 evidence lines each), Esc closes, prev/next, deep link `#/player/2933/bowl` shows CSV values | Playwright | pass |
| Ask-the-data comparison | Playwright | pass |
| Before/after slider keyboard-operable, player switch | Playwright | pass |
| No horizontal overflow at 1440 / 820 / 390; charts render (>100 scatter points, >8 chart SVGs) | Playwright | pass |
| No console errors, no failed requests (mascot sheets 200) | Playwright | pass |

## Defects found and fixed during QA
1. Landing blank: floodlight overlay had no default clip-path → covered the page. Fixed.
2. Ranking table overflowed at desktop widths (9 columns) → merged ball/match columns; tuned widths.
3. Mobile overflow from the nav (flex child without `min-width:0`) and the player index (inline `span 6`). Fixed.
4. Duplicate DOM id (`ask`) broke the form label association → input renamed.
5. Programmatic section jump used smooth scroll and stopped short → instant jump.
6. Mobile ranking rows overlapped (grid auto-placement) → explicit columns.
7. Scatter labels collided in the dense cluster → vertical label spacing with leader lines.
8. Copy error caught on review: text claimed selected players sit *on or below* the baseline diagonal; in fact most sit above in raw terms (selection effect). Rewritten.
9. Rank quantiles displayed as `57.200000000000045` → rounded for display (documented in DATA_MAPPING.md).
10. Landing hint said "cursor" on touch devices → context-aware text.

## Design review (manual critique, Impeccable not available — see README note)
Checked against `DESIGN.md`: no glass/neon/gradient cards; 3 accent colours with fixed semantics; Fraunces / Schibsted Grotesk / IBM Plex Mono; asymmetric 12-col grid with margin rail; ranking is a typeset ledger (hero #1 + hairline rows), not identical cards; uncertainty shown beside every name; charts use direct labels and hairlines. Known weaknesses: the lower half of the Evidence section is chart-dense; the Contributions chart for batters shows no amber segment by design (R = 0), which a first-time reader may not expect (explained in its caption).

Screenshots: `screenshots/` (desktop 1440×900, tablet 820, mobile 390).
