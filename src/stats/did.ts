import { olsClustered, type Coefficient } from './ols'
import type { Observation } from './types'

export interface CellMeans {
  comparisonPre: number
  comparisonPost: number
  treatedPre: number
  treatedPost: number
  /** (treatedPost - treatedPre) - (comparisonPost - comparisonPre) */
  did: number
}

export interface DidResult {
  /** The DiD estimate: coefficient on treated x post. */
  effect: Coefficient
  means: CellMeans
  nObs: number
  nUnits: number
  df: number
}

export interface ParallelTrendsResult {
  /** Differential pre-period slope (treated minus comparison), per period. */
  slopeDifference: Coefficient
  /** True when the slope difference is significant at `alpha`: evidence against parallel trends. */
  violated: boolean
  alpha: number
}

export function cellMeans(data: Observation[]): CellMeans {
  const sums = { '00': [0, 0], '01': [0, 0], '10': [0, 0], '11': [0, 0] } as Record<string, [number, number]>
  for (const o of data) {
    const c = sums[`${o.treated}${o.post}`]
    c[0] += o.y
    c[1] += 1
  }
  const m = (key: string) => {
    const [s, n] = sums[key]
    if (n === 0) throw new Error('Each of the four group x period cells needs at least one observation')
    return s / n
  }
  const comparisonPre = m('00')
  const comparisonPost = m('01')
  const treatedPre = m('10')
  const treatedPost = m('11')
  return {
    comparisonPre,
    comparisonPost,
    treatedPre,
    treatedPost,
    did: treatedPost - treatedPre - (comparisonPost - comparisonPre),
  }
}

/** Two-way DiD via OLS: y ~ 1 + treated + post + treated:post, SEs clustered by unit. */
export function estimateDiD(data: Observation[]): DidResult {
  const means = cellMeans(data)
  const fit = olsClustered(
    data.map((o) => [1, o.treated, o.post, o.treated * o.post]),
    data.map((o) => o.y),
    data.map((o) => o.unit),
  )
  return {
    effect: fit.coefficients[3],
    means,
    nObs: fit.nObs,
    nUnits: fit.nClusters,
    df: fit.df,
  }
}

/**
 * Pre-period parallel-trends check: on pre-treatment data only, fit
 * y ~ 1 + treated + period + treated:period and test the interaction.
 * Needs >= 2 pre periods; with exactly 2 the test has no residual variation within
 * unit, so >= 3 is recommended. A non-significant result is NOT proof of parallel trends.
 */
export function testParallelTrends(data: Observation[], alpha = 0.05): ParallelTrendsResult | null {
  const pre = data.filter((o) => o.post === 0)
  if (new Set(pre.map((o) => o.period)).size < 2) return null
  const fit = olsClustered(
    pre.map((o) => [1, o.treated, o.period, o.treated * o.period]),
    pre.map((o) => o.y),
    pre.map((o) => o.unit),
  )
  const slopeDifference = fit.coefficients[3]
  return { slopeDifference, violated: slopeDifference.p < alpha, alpha }
}
