import type { Field } from './fields'

export interface TourStep {
  title: string
  body: string
  /** Form field keys (or "run") to highlight on this step. */
  targets: Array<Field['key'] | 'run'>
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to the Lab',
    body: "You'll build a fake study where you secretly know the true answer, then see whether difference-in-differences (DiD) finds it. It takes about a minute to set up.",
    targets: [],
  },
  {
    title: 'Two groups, before and after',
    body: 'DiD compares a treated group with a comparison group, before and after the treatment starts. Choose how many units are in each group, how many periods you observe, and when treatment begins.',
    targets: ['unitsPerGroup', 'periods', 'treatmentStart'],
  },
  {
    title: 'The true effect and the noise',
    body: "The true effect is the real change the treatment causes. Noise is random variation that can hide it. More noise means a wider confidence interval, so it's harder to be sure.",
    targets: ['effectSize', 'noise'],
  },
  {
    title: 'The parallel-trends assumption',
    body: "DiD assumes both groups would have moved in parallel without treatment. A starting gap is fine, but a trend difference breaks the assumption and biases the answer. Leave it at 0 first, then come back and try it.",
    targets: ['baselineDifference', 'trendDifference'],
  },
  {
    title: 'Run it',
    body: "Run the experiment to see the estimate and its confidence interval. Then use 'Reveal the true effect' to check how close DiD got.",
    targets: ['run'],
  },
]
