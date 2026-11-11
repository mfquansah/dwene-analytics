# Dwene Analytics — Decision Log

_Last updated: 2026-11-11_

## Decisions made

| Date | Decision | Notes |
|---|---|---|
| 2026-11-11 | MVP 1.0 covers one method: Difference-in-Differences | Product brief |
| 2026-11-11 | Two experiences: Guided Learning and Experiment Sandbox | Product brief |
| 2026-11-11 | CSV upload deferred to MVP 2.0 | Product brief |
| 2026-11-11 | Keep the five-screen mockup structure; adapt A/B content to DiD | Product brief |
| 2026-11-11 | Starting from scratch: no existing codebase | User |
| 2026-11-11 | **Stack: Option A.** TypeScript web app, all stats computed client-side, no backend. Treated as a proof of concept | User. Revisit with Option B (Python API) if the PoC proves worth investing in |
| 2026-11-11 | **No login / accounts for the PoC.** App is open | User. Sessions/accounts to be added only if users like it |
| 2026-11-11 | Target users: both students and analysts | User |
| 2026-11-11 | Frontend: React + Vite + TypeScript | User approved |
| 2026-11-11 | Persistence: saved experiments and lesson progress survive refresh, via browser local storage (not cookies: 4 KB limit, sent on every request) | User chose local storage or cookies; local storage picked for technical reasons |
| 2026-11-11 | Sandbox first entry: short guided walkthrough | User |
| 2026-11-11 | Charts: Recharts. Router: React Router | User approved |
| 2026-11-11 | Sandbox parameters: effect size, noise, baseline group difference, trend difference, units per group, periods, treatment start, seed | User approved |
| 2026-11-11 | Theme: follow the mockups (indigo accent), overriding the brief's warm grey + orange | User |
| 2026-11-11 | Lesson plan to be created together with the user | User |

## Work completed

- Repo inspected: empty, no prior code.
- Draft `docs/PRD.md` (open items flagged).
- Draft `docs/DEVELOPMENT_PLAN.md`.
- Phases 2–3 (first cut): local-storage layer (versioned, corruption-safe), app shell, Experiment Designer, Results page (estimate, CI, trend chart with counterfactual and treatment marker, 2×2 means, parallel-trends check, interpretation, ground-truth reveal), Home. Verified in a real browser: run, reload persistence, validation, mobile layout.
- Phase 1: stats core (`src/stats`): seeded generator, DiD estimator with unit-clustered SEs, parallel-trends test; 30 tests incl. cross-check against statsmodels.
- Phase 0: Vite + React + TS scaffold, Vitest, router shell, placeholder tokens.

## Still being explored

- Hosting provider (needs GitHub push working first). SPA routes need a rewrite rule to `index.html` on the chosen host.
- Not yet built: guided walkthrough (Phase 4, steps TBD), Learn module (lesson plan TBD), repeated simulations, day-by-day playback, Datasets/Templates nav (omitted from the sidebar for now since upload is out of scope).
- Production bundle is ~700 kB (Recharts); fine for a PoC, optimise later if needed.

- Added optional generator parameters beyond the approved list, defaulted so the approved list still works alone: `commonTrend` (0.5), `baselineLevel` (10), `unitEffectSd` (0). Confirm or remove.
- Estimator choices to confirm: SEs clustered by unit with t(G-1) inference (matches Stata/statsmodels); parallel-trends test is a pre-period slope-difference test (not proof of parallel trends).

- Lesson format (proposed: MDX) and lesson plan
- Hosting (proposed: static host; not yet confirmed)
- Exact design token values (need higher-res mockups or design file)
- Content of the guided walkthrough steps
- Lesson content: authorship and count for 1.0
- Whether to keep the stats module interface narrow so a Python backend can replace it later (proposed: yes)
