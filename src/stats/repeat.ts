import { estimateDiD } from './did'
import { generateData } from './generate'
import type { SimParams } from './types'

export interface RepeatResult {
  estimates: number[]
  reps: number
  mean: number
  sd: number
  /** Share of runs whose 95% interval contained the true effect. */
  coverage: number
  /** Share of runs significant at alpha = 0.05. */
  significantRate: number
}

/** Runs to use for a design: roughly constant total work, between 100 and 1000. */
export function repeatsFor(p: Pick<SimParams, 'unitsPerGroup' | 'periods'>): number {
  return Math.max(100, Math.min(1000, Math.round(150000 / (2 * p.unitsPerGroup * p.periods))))
}

/**
 * Re-run the same design with fresh random draws (new seeds) to show how estimates vary.
 * The truth is known, so we can report how often the interval covers it.
 */
export function repeatStudy(params: SimParams, reps = repeatsFor(params)): RepeatResult {
  const estimates: number[] = []
  let covered = 0
  let sig = 0
  for (let r = 0; r < reps; r++) {
    const { data, truth } = generateData({ ...params, seed: Math.imul(params.seed + 7, 104729) + r })
    const { effect } = estimateDiD(data)
    estimates.push(effect.estimate)
    if (effect.ci95[0] <= truth.trueEffect && truth.trueEffect <= effect.ci95[1]) covered++
    if (effect.p < 0.05) sig++
  }
  const mean = estimates.reduce((a, b) => a + b, 0) / reps
  const sd = Math.sqrt(estimates.reduce((a, b) => a + (b - mean) ** 2, 0) / (reps - 1))
  return { estimates, reps, mean, sd, coverage: covered / reps, significantRate: sig / reps }
}

export interface Bin {
  from: number
  to: number
  mid: number
  count: number
}

/** Equal-width histogram over [min, max] of the values (max inclusive in the last bin). */
export function histogram(values: number[], bins: number, range?: [number, number]): Bin[] {
  if (values.length === 0 || bins < 1) return []
  let lo = range?.[0] ?? Math.min(...values)
  let hi = range?.[1] ?? Math.max(...values)
  if (hi === lo) { lo -= 0.5; hi += 0.5 }
  const w = (hi - lo) / bins
  const out: Bin[] = Array.from({ length: bins }, (_, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, mid: lo + (i + 0.5) * w, count: 0 }))
  for (const v of values) {
    if (v < lo || v > hi) continue
    out[Math.min(bins - 1, Math.floor((v - lo) / w))].count++
  }
  return out
}
