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

## Work completed

- Repo inspected: empty, no prior code.
- Draft `docs/PRD.md` (open items flagged).

## Still being explored

- Persistence approach (proposed default: browser local storage; not yet confirmed)
- Frontend framework and tooling (proposed: React + Vite + TypeScript; not yet confirmed)
- Hosting (proposed: static host; not yet confirmed)
- Design tokens: mockup palette conflicts with brief's theme direction (see PRD §6)
- Sandbox first-entry experience
- Lesson content: authorship and count for 1.0
- Exact Sandbox parameter list
- Whether to keep the stats module interface narrow so a Python backend can replace it later (proposed: yes)
