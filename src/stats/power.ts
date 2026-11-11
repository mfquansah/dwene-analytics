import { tQuantile } from './distributions'
import { estimateDiD } from './did'
import { generateData } from './generate'
import type { SimParams } from './types'

export interface PowerResult {
  /** Share of simulated studies whose DiD estimate was significant at `alpha`. */
  power: number
  /** Average cluster-robust standard error across the simulated studies. */
  meanSe: number
  /** Approximate smallest true effect detectable with 80% power at this design (two-sided alpha = 0.05). */
  minDetectableEffect: number
  /** Approximate units per group needed for 80% power at the current effect, or null when the effect is 0. */
  unitsPerGroupFor80: number | null
  reps: number
}

/**
 * Multiplier on the standard error for a two-sided alpha = .05 test with 80% power.
 * Uses t quantiles with the study's degrees of freedom (clusters - 1) instead of z, because
 * with few units the t critical value is noticeably larger.
 */
const critSum = (clusters: number): number => tQuantile(0.975, clusters - 1) + tQuantile(0.8, clusters - 1)

/** Keep total work (simulated observations) roughly constant so big designs stay responsive. */
export function repsFor(p: Pick<SimParams, 'unitsPerGroup' | 'periods'>): number {
  return Math.max(40, Math.min(200, Math.round(60000 / (2 * p.unitsPerGroup * p.periods))))
}

/**
 * Monte Carlo power: re-simulate the design `reps` times with different seeds and count how often
 * the DiD estimate is significant. Deterministic for a given design and seed.
 */
export function estimatePower(params: SimParams, alpha = 0.05, reps = repsFor(params)): PowerResult {
  let hits = 0
  let seSum = 0
  for (let r = 0; r < reps; r++) {
    const { data } = generateData({ ...params, seed: Math.imul(params.seed + 1, 7919) + r })
    const { effect } = estimateDiD(data)
    seSum += effect.se
    if (effect.p < alpha) hits++
  }
  const meanSe = seSum / reps
  const mde = critSum(2 * params.unitsPerGroup) * meanSe
  const e = Math.abs(params.effectSize)
  return {
    power: hits / reps,
    meanSe,
    minDetectableEffect: mde,
    unitsPerGroupFor80: e > 0 ? unitsNeeded(params.unitsPerGroup, meanSe, e) : null,
    reps,
  }
}

/** Smallest units-per-group whose minimum detectable effect is at most `effect`. SE shrinks with sqrt(units). */
function unitsNeeded(n0: number, se0: number, effect: number): number {
  for (let n = 2; n <= 100000; n++) {
    if (critSum(2 * n) * se0 * Math.sqrt(n0 / n) <= effect) return n
  }
  return 100000
}
