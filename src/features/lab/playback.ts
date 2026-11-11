import { estimateDiD, type Observation } from '../../stats'

export interface InterimResult {
  /** Last period included (0-indexed). */
  upTo: number
  estimate: number
  p: number
}

/**
 * The DiD estimate as an analyst would see it after each post-treatment period:
 * re-estimated on only the data observed so far. Index i is for upTo = treatmentStart + i.
 */
export function interimResults(data: Observation[], treatmentStart: number, periods: number): InterimResult[] {
  const out: InterimResult[] = []
  for (let upTo = treatmentStart; upTo < periods; upTo++) {
    const { effect } = estimateDiD(data.filter((o) => o.period <= upTo))
    out.push({ upTo, estimate: effect.estimate, p: effect.p })
  }
  return out
}

/** The interim result available at `current` (the latest observed period), or null before treatment starts. */
export function interimAt(results: InterimResult[], current: number): InterimResult | null {
  return results.find((r) => r.upTo === current) ?? null
}

/** How many looks so far had p < alpha: the "peeking" problem, since stopping at any of them would have looked like a win. */
export function peeksBelow(results: InterimResult[], current: number, alpha = 0.05): number {
  return results.filter((r) => r.upTo <= current && r.p < alpha).length
}

export const SPEEDS = [1, 4, 16] as const
/** Milliseconds per period at 1x. */
export const BASE_MS = 1200
export const msPerPeriod = (speed: number): number => Math.round(BASE_MS / speed)
