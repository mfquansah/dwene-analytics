/** Parameters for the sandbox's data-generating process. */
export interface SimParams {
  /** Units (e.g. regions, stores) in each of the treated and comparison groups. */
  unitsPerGroup: number
  /** Total periods, pre + post. */
  periods: number
  /** First treated period (0-indexed). Periods before it are "pre". Must be in [1, periods - 1]. */
  treatmentStart: number
  /** True additive effect on treated units from `treatmentStart` onward. */
  effectSize: number
  /** SD of the idiosyncratic noise on each unit-period outcome. */
  noise: number
  /** Level gap between treated and comparison groups (treated minus comparison). Constant over time; does not bias DiD. */
  baselineDifference: number
  /** Extra per-period slope for treated units. Non-zero violates parallel trends and biases the DiD estimate. */
  trendDifference: number
  seed: number
  /** Per-period slope shared by both groups. Default 0.5. */
  commonTrend?: number
  /** Outcome level for comparison units at period 0. Default 10. */
  baselineLevel?: number
  /** SD of a persistent per-unit effect. Default 0. Makes outcomes correlated within unit. */
  unitEffectSd?: number
}

export interface Observation {
  unit: number
  period: number
  treated: 0 | 1
  post: 0 | 1
  y: number
}

/** Known truth for a simulated panel; used for the "ground truth reveal" and for charts. */
export interface SimTruth {
  trueEffect: number
  /** Expected outcome per period, with no noise and no unit effects. */
  expected: {
    treated: number[]
    comparison: number[]
    /** What treated units would have looked like absent treatment (the true counterfactual). */
    treatedCounterfactual: number[]
  }
  /** Bias in the DiD estimate that parallel-trends violation causes (0 when trendDifference = 0). */
  expectedBias: number
}

export interface SimDataset {
  params: Required<SimParams>
  data: Observation[]
  truth: SimTruth
}
