# Dwene Learning Studio — Curriculum & Lesson Design v1.0

_Provided by the user on 2026-11-11. Implemented in `src/features/learn/`._

## Philosophy
Learn causal inference by doing it. Each lesson: **real-world problem → think → experiment → understand → apply**. 5–10 minutes, mostly interaction. One primary objective and one meaningful exercise per lesson.

## MVP course: Difference-in-Differences (~37 min)

| # | Lesson | Min | Objective |
|---|---|---|---|
| 1 | Did the intervention work? | 5 | Why before-and-after comparisons can mislead |
| 2 | The DiD framework | 7 | Treatment/comparison groups, pre/post, counterfactual |
| 3 | Calculate the treatment effect | 8 | Calculate and interpret the DiD estimate (100→130 vs 90→110 = +10) |
| 4 | The parallel trends assumption | 9 | Why DiD needs a credible untreated trend; similar pre-trends do not prove it |
| 5 | Interpret and communicate results | 8 | Uncertainty, effect size vs significance, alternative explanations |

## Learning-experience rules
Show then explain · one decision at a time · hints before answers · make assumptions visible · Sandbox as an extension · measure understanding with independent application · statistical correctness (separate true effects from estimates; never imply diagnostics prove causality).

## Lesson format
Lessons are data (`Lesson` in `src/features/learn/types.ts`), rendered by one player, so new courses need no new UI.

| Schema field | Implementation |
|---|---|
| lessonId, title, durationMinutes, objective, scenario, takeaway | Same-named fields on `Lesson` |
| concepts | `concepts[]`, shown on the completion screen |
| dataset | Per step: `table`/`chart` for illustrative data, or `params` for a live simulation |
| steps, interactionType | `steps[]`, discriminated by `kind`: `read`, `choice`, `numeric`, `explore` (chart manipulation), `simulation` (parameter adjustment) |
| correctAnswer, hints, explanation | On `choice` and `numeric` steps; hints escalate per wrong attempt |
| completionRule | Fixed rule: a lesson is complete when every step has a recorded status |

## Priorities
- **P0 (built):** five-lesson course and navigation; interactive components and feedback; shared simulation engine; completion and progress tracking.
- **P1 (built):** open lesson scenario in the Lab (Lesson 4, via query-string presets); independent end-of-course challenge.
- **P2:** additional scenarios, achievements, learning paths.

## Final challenge (`did-challenge`, ~10 min)
Three new cases, no hints, scored on first attempts (6 graded questions). A wrong answer gets "Not quite" with no hint, and the answer can be shown after two misses. The summary shows the score and links to the lessons behind each miss.
- **Case A (compute):** a transit-pass DiD table (+6), and whether a starting gap invalidates DiD (no).
- **Case B (diagnose):** a live simulated study with a hidden trend difference. The estimate (+6.0) has a narrow interval, but the pre-trend check flags a difference. The learner decides whether to trust it, then sees the truth revealed (true effect 3.0).
- **Case C (communicate):** pick the best write-up of an inconclusive result, then the most credible comparison group for a new study.
Tests assert that the case text matches what the engine actually produces, so wording cannot drift from the numbers.
