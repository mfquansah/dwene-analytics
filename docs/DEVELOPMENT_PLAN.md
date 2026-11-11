# Dwene Analytics — Development Plan (Draft)

_2026-11-11. Stack: React + Vite + TypeScript, client-side only, no auth, local storage persistence._

Phases 0–1 need nothing from the user and can start immediately.

## Phase 0 — Scaffold (small)
- Vite + React + TS, Vitest, ESLint, Prettier.
- Folder layout: `src/stats/` (pure, no React), `src/storage/`, `src/features/{home,learn,lab,results}/`, `src/theme/tokens.css`.
- Placeholder token file (neutral grey + one orange accent) so the theme lives in one place.
- Done when: `npm run dev`, `npm test`, `npm run build` all pass.

## Phase 1 — Stats core (testable in isolation)
1. Seeded RNG (deterministic output for a given seed).
2. `generateData(params)`: panel of units × periods, treatment and comparison groups, baseline difference, trend difference, true effect, noise.
3. `estimateDiD(data)`: regression `y ~ treated + post + treated:post`, estimate, cluster-robust SE by unit, t-based 95% CI, p-value, plus the 2×2 means table.
4. `parallelTrends(data)`: pre-period test of treated × time interaction.
5. Tests:
   - Known true effect recovered within tolerance across many seeds.
   - CI coverage near 95% over repeated simulations.
   - Parallel-trends flag fires when trend difference is injected, and stays quiet when it is zero.
   - Cross-check against statsmodels on fixed fixture datasets.
- Done when all tests pass and the module has no UI dependencies.

## Phase 2 — App shell
- Routing, sidebar nav, layout from the mockup, design tokens applied.
- Versioned local-storage layer (`schemaVersion`, safe fallback when data is missing or corrupt).
- Needs: higher-res mockups for exact tokens (can start with placeholders).

## Phase 3 — Sandbox
- Experiment Designer: DiD parameter form with validation.
- Results Explorer: DiD estimate and CI, 2×2 table, treated vs comparison chart with counterfactual, parallel-trends view, ground-truth reveal.
- Save and reopen experiments from local storage.
- Optional later: repeated simulations, day-by-day playback.

## Phase 4 — Guided first-entry walkthrough
- Short step-by-step flow on first Sandbox visit (steps TBD with user), skippable, remembered in local storage.

## Phase 5 — Guided Learning
- Lesson framework: lesson content as typed data/MDX files, interactive exercise components, quick checks with explanations, progress saved locally.
- Lessons link into the Sandbox with preset parameters.
- Number and content of lessons TBD.

## Phase 6 — Home and release
- Home screen (continue learning, recent experiments, methods list).
- Static deploy (Vercel/Netlify/Cloudflare Pages), basic CI running lint, tests, build.

## Proposals needing your OK
- **Charts:** Recharts (fastest to build) vs. hand-rolled SVG/d3 (more control for custom DiD plots). I suggest Recharts for the PoC.
- **Router:** React Router.
- **Lessons:** authored as MDX with embedded React exercises.
- **Parameter list:** the candidate list in PRD §7.1 (effect size, noise, baseline difference, trend difference, units per group, periods, treatment start, seed).

## Blocked on user
- Mockups at higher resolution or the design file (Phase 2 tokens).
- Walkthrough steps (Phase 4).
- Lesson topics and count (Phase 5).
- Theme decision: brief's warm grey + orange vs. mockup's indigo.
