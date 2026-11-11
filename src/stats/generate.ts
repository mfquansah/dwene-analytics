import { createRng } from './rng'
import type { Observation, SimDataset, SimParams } from './types'

/** Upper bounds keep a mistyped value from freezing the browser. */
export const MAX_UNITS_PER_GROUP = 500
export const MAX_PERIODS = 60

export function validateParams(p: SimParams): string[] {
  const errors: string[] = []
  if (!Number.isInteger(p.unitsPerGroup) || p.unitsPerGroup < 2 || p.unitsPerGroup > MAX_UNITS_PER_GROUP) errors.push(`unitsPerGroup must be an integer from 2 to ${MAX_UNITS_PER_GROUP}`)
  if (!Number.isInteger(p.periods) || p.periods < 2 || p.periods > MAX_PERIODS) errors.push(`periods must be an integer from 2 to ${MAX_PERIODS}`)
  if (!Number.isInteger(p.treatmentStart) || p.treatmentStart < 1 || p.treatmentStart > p.periods - 1)
    errors.push('treatmentStart must be an integer in [1, periods - 1]')
  if (!(p.noise >= 0)) errors.push('noise must be >= 0')
  if ((p.unitEffectSd ?? 0) < 0) errors.push('unitEffectSd must be >= 0')
  for (const k of ['effectSize', 'baselineDifference', 'trendDifference', 'seed'] as const)
    if (!Number.isFinite(p[k])) errors.push(`${k} must be a finite number`)
  return errors
}

/**
 * Generate a balanced panel. For treated flag D, period t, post = [t >= treatmentStart]:
 *   y = baselineLevel + commonTrend*t + D*(baselineDifference + trendDifference*t)
 *       + D*post*effectSize + unitEffect + noise
 * Units 0..N-1 are treated, N..2N-1 are comparison.
 */
export function generateData(input: SimParams): SimDataset {
  const errors = validateParams(input)
  if (errors.length) throw new RangeError(errors.join('; '))
  const params = {
    commonTrend: 0.5,
    baselineLevel: 10,
    unitEffectSd: 0,
    ...input,
  } as Required<SimParams>
  const { unitsPerGroup: n, periods, treatmentStart } = params
  const rng = createRng(params.seed)

  const mean = (treated: 0 | 1, t: number, withEffect: boolean) =>
    params.baselineLevel +
    params.commonTrend * t +
    treated * (params.baselineDifference + params.trendDifference * t) +
    (withEffect && treated && t >= treatmentStart ? params.effectSize : 0)

  const data: Observation[] = []
  for (let unit = 0; unit < 2 * n; unit++) {
    const treated: 0 | 1 = unit < n ? 1 : 0
    const unitEffect = params.unitEffectSd * rng.normal()
    for (let period = 0; period < periods; period++) {
      const post: 0 | 1 = period >= treatmentStart ? 1 : 0
      data.push({
        unit,
        period,
        treated,
        post,
        y: mean(treated, period, true) + unitEffect + params.noise * rng.normal(),
      })
    }
  }

  const range = Array.from({ length: periods }, (_, t) => t)
  // Bias of the 2x2 DiD: trendDifference * (mean post period - mean pre period).
  const avg = (ts: number[]) => ts.reduce((a, b) => a + b, 0) / ts.length
  const postTs = range.filter((t) => t >= treatmentStart)
  const preTs = range.filter((t) => t < treatmentStart)

  return {
    params,
    data,
    truth: {
      trueEffect: params.effectSize,
      expected: {
        treated: range.map((t) => mean(1, t, true)),
        comparison: range.map((t) => mean(0, t, true)),
        treatedCounterfactual: range.map((t) => mean(1, t, false)),
      },
      expectedBias: params.trendDifference * (avg(postTs) - avg(preTs)),
    },
  }
}
