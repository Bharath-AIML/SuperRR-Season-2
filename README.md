# The Pressure Atlas (web)
Frontend-only, static site for *SupeRR Selector S2 · Round 1*: the ten most reliable batters and bowlers under pressure, with the full methodology and per-player evidence. Independent analysis of the official data pack; no franchise branding.

## Run
```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build -> dist/
npm run preview    # serve dist/ at http://127.0.0.1:4173
```
Node 18+. **Static hosting:** upload `dist/` to any static host (asset paths are relative, routing uses `#/` hashes, so no server rewrites are needed). To refresh the data from the competition outputs: `npm run data` (uses `../.venv`; needs pandas) — then rebuild.

## Structure
- `DESIGN.md` — the project's design system. `DATA_MAPPING.md` — where every number comes from.
- `src/lib/data.ts` typed data access · `src/lib/query.ts` deterministic “ask the data” engine (no AI, no network).
- `src/components/` Landing, Analysis shell, Results, Method (pressure/performance/rating), Evidence, Dossier, Charts (custom SVG).
- Mascot: free character “Cap” from koboyo.com/page-mascot (`public/mascots/cap-*.webp`). `scripts/build_sprites.mjs` is the retired hand-drawn alternative.
- Cursor behaviour is the official [`page-mascot`](https://www.npmjs.com/package/page-mascot) component (MIT).

## Tests
```bash
npm test                 # vitest: data mapping vs SUBMISSION_rankings.csv, rating identity, query engine (10 tests)
npx playwright install chromium && npx playwright test   # 14 browser tests + screenshots to screenshots/
```
Results of the last run: `QA.md`.
# SuperRR-Season-2
