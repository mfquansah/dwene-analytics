import type { Observation, SimDataset } from '../../stats'

export interface TrendPoint {
  period: number
  treated: number
  comparison: number
  /** DiD counterfactual: treated pre-period mean, moved by the comparison group's change. */
  estimatedCounterfactual?: number
  trueCounterfactual?: number
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export function buildTrendSeries(ds: SimDataset): TrendPoint[] {
  const { periods, treatmentStart } = ds.params
  const byCell = (treated: 0 | 1, t: number) => mean(ds.data.filter((o: Observation) => o.treated === treated && o.period === t).map((o) => o.y))
  const treated = Array.from({ length: periods }, (_, t) => byCell(1, t))
  const comparison = Array.from({ length: periods }, (_, t) => byCell(0, t))
  const treatedPre = mean(treated.slice(0, treatmentStart))
  const comparisonPre = mean(comparison.slice(0, treatmentStart))
  return treated.map((y, t) => ({
    period: t,
    treated: y,
    comparison: comparison[t],
    // Shown from the last pre period so the dashed line connects to the treated line.
    estimatedCounterfactual: t >= treatmentStart - 1 ? treatedPre + (comparison[t] - comparisonPre) : undefined,
    trueCounterfactual: t >= treatmentStart - 1 ? ds.truth.expected.treatedCounterfactual[t] : undefined,
  }))
}
