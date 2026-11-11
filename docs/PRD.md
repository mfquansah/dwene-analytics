# Dwene Analytics — PRD (Draft v0.1)

_Status: draft, 2026-11-11. Items marked **[TBD]** are undecided. Do not treat them as settled._

## 1. Summary

Dwene is a learning-and-experimentation platform for causal inference. MVP 1.0 is a **proof of concept** covering one method, **Difference-in-Differences (DiD)**, with two experiences: **Guided Learning** and **Experiment Sandbox**.

## 2. Users

Students and practitioner analysts. **[TBD]** Whether the two groups need different entry points or depth. The mockup persona is "Taylor Kim, Product Manager"; confirm if that persona is intended.

## 3. Scope

**In scope (1.0 PoC):** guided lessons with interactive exercises; sandbox with generated datasets, adjustable assumptions, DiD analysis, and visualizations; client-side computation only; no accounts.

**Out of scope:** CSV upload (2.0); other causal methods; randomized A/B as the primary framing; accounts, login, server-side persistence; backend.

## 4. Technical constraints (decided)

- Option A: TypeScript, all computation in the browser, no backend.
- No auth.
- Stats code lives in an isolated module with a narrow interface (`generateData(params)`, `estimateDiD(data)`), so it can be swapped for a Python service later.
- Statistical correctness is tested: known true effects must be recovered within tolerance; outputs cross-checked against statsmodels on fixed datasets.
- **[TBD]** Framework, persistence, hosting (proposals in DECISIONS.md).

## 5. Screens (from mockup)

The mockup contains five screens, currently framed around randomized A/B testing ("Experiment Lab"). The structure is kept; content must be adapted to DiD.

| # | Mockup screen | DiD adaptation needed |
|---|---|---|
| 1 | Home / Experiment Lab: hero, Learn Mode and Lab Mode cards, recent experiments, methods library | Methods library shows DiD as the available method; others as "coming later" **[TBD]**. Hero chart should show a DiD plot |
| 2 | Experiment Designer: name/hypothesis, method, metric, true effect, sample size, duration, power check | Replace "Randomized A/B" with DiD design: treatment vs comparison group, pre/post periods, treatment start date, group baseline difference, trend difference, effect size, noise |
| 3 | Simulation Playground: live results, cumulative conversion chart, incoming-user dots | Re-frame as treated vs comparison trajectories over time with the treatment start marked. **[TBD]** Is live day-by-day streaming kept, or is DiD simulated all at once? |
| 4 | Results Explorer: group comparison, effect CI, interpretation, repeated simulations, guardrails | Show DiD estimate with CI, 2x2 means table, parallel-trends diagnostic, ground-truth reveal. **[TBD]** Which tabs survive (Overview, Statistical analysis, Distributions, Repeated simulations, Segments) |
| 5 | Lesson (Learn): lesson list, interactive exercise, quick check, key takeaway | Mockup lesson is "Randomization and control". Needs a DiD lesson sequence **[TBD]** |

Sidebar nav in the mockup: Home, Learn, Lab, Datasets, Templates, Results. **[TBD]** "Datasets" and "Templates" imply upload and saved items. Datasets must be generated-only for 1.0. Decide whether these remain as nav items.

## 6. Design

- Keep the mockup layout.
- **Conflict to resolve:** the mockup is white/cool-grey with an **indigo/purple** accent. The brief asks for warm-neutral, greyer surfaces with **orange only as an accent**. **[TBD]** Confirm the brief's theme wins over the mockup colors.
- Tokens as CSS variables so the theme changes in one place. The pasted mockup is too low-resolution to extract exact hex values. **[TBD]** Final palette and typography; need a higher-resolution export or the design file.

## 7. Functional requirements

### 7.1 Sandbox

| ID | Requirement | Acceptance criteria |
|---|---|---|
| S1 | Generate a panel dataset with treatment and comparison groups over pre and post periods | Given parameters and a seed, output is deterministic; group and period counts match inputs |
| S2 | Adjustable assumptions | See parameter list below. Changing a value regenerates data and results without page reload |
| S3 | Compute the DiD estimate with standard error and 95% CI | On synthetic data with known true effect, estimate is within tolerance over N seeds (**[TBD]** N and tolerance) |
| S4 | Parallel-trends diagnostic | Flags violation when trend difference is injected; passes when trends are equal. **[TBD]** Test method (visual only, pre-period slope test, or both) |
| S5 | Visualizations | Treated vs comparison trajectories, the counterfactual, the estimated effect, and a 2x2 means table |
| S6 | Ground-truth reveal | Shows true vs estimated effect |
| S7 | Repeated simulations | Re-run many times to show estimator spread. **[TBD]** Keep for 1.0? |
| S8 | First-entry experience | **[TBD]** Open question, to be resolved in the journeys doc |

**Candidate parameter list [TBD, none confirmed]:** true effect size, noise (SD), baseline difference between groups, pre-period trend difference, number of units per group, number of periods (pre/post), treatment start period, seed.

### 7.2 Guided Learning

| ID | Requirement | Acceptance criteria |
|---|---|---|
| L1 | Structured lesson sequence | Lessons listed with duration and progress state. **[TBD]** Number and content of lessons |
| L2 | Interactive exercises with feedback | Each lesson has at least one manipulable exercise and a quick check with explained answers |
| L3 | Link from lessons to the Sandbox | A lesson can open the Sandbox with preset parameters |
| L4 | Progress tracking | **[TBD]** Local storage only, or none |
| L5 | Lesson authorship and format | **[TBD]** Who writes lessons; authored as code or markdown/data files |

### 7.3 General

| ID | Requirement | Acceptance criteria |
|---|---|---|
| G1 | No login required | App is fully usable on first visit |
| G2 | Runs without a backend | Works as a static site |
| G3 | Persistence | **[TBD]** Whether saved experiments and progress persist between visits |

## 8. Open questions

1. Final stack tooling, hosting, persistence.
2. Sandbox parameter list and ranges.
3. Sandbox first-entry experience.
4. Lesson count, content, and authorship.
5. Theme: mockup colors vs the brief's warm grey + orange.
6. Which nav items and result tabs survive the A/B to DiD adaptation.
7. Whether students and analysts need different depth.
8. Higher-resolution mockups or the design file for token extraction.
