import { describe, expect, test } from 'vitest'
import { estimatePower, repsFor } from './power'
import type { SimParams } from './types'

const base: SimParams = { unitsPerGroup: 20, periods: 12, treatmentStart: 6, effectSize: 2, noise: 1.5, baselineDifference: 3, trendDifference: 0, seed: 5 }

describe('estimatePower', () => {
  test('is deterministic for a given design and seed', () => {
    expect(estimatePower(base)).toEqual(estimatePower(base))
  })
  test('with no true effect, significance is rare (about alpha)', () => {
    const r = estimatePower({ ...base, effectSize: 0 }, 0.05, 400)
    expect(r.power).toBeLessThan(0.1)
    expect(r.unitsPerGroupFor80).toBeNull()
  })
  test('a very large effect is almost always detected', () => {
    expect(estimatePower({ ...base, effectSize: 10 }).power).toBeGreaterThan(0.98)
  })
  test('power rises with effect size and with sample size, and falls with noise', () => {
    const p = (o: Partial<SimParams>) => estimatePower({ ...base, ...o }, 0.05, 150).power
    const weak = p({ effectSize: 0.4 })
    expect(weak).toBeGreaterThan(0.2) // not saturated at either end, so the comparisons below mean something
    expect(weak).toBeLessThan(0.8)
    expect(p({ effectSize: 0.8 })).toBeGreaterThan(weak)
    expect(p({ effectSize: 0.4, unitsPerGroup: 80 })).toBeGreaterThan(weak)
    expect(p({ effectSize: 0.4, noise: 4 })).toBeLessThan(weak)
  })
  test('the design really is detected at the reported minimum detectable effect (~80%)', () => {
    const r = estimatePower(base, 0.05, 150)
    const atMde = estimatePower({ ...base, effectSize: r.minDetectableEffect }, 0.05, 300).power
    expect(atMde).toBeGreaterThan(0.7)
    expect(atMde).toBeLessThan(0.9)
  })
  test('the units-per-group estimate for 80% power is roughly right', () => {
    const weak = { ...base, effectSize: 0.4 }
    const r = estimatePower(weak, 0.05, 150)
    expect(r.unitsPerGroupFor80!).toBeGreaterThan(weak.unitsPerGroup)
    const at = estimatePower({ ...weak, unitsPerGroup: Math.min(500, r.unitsPerGroupFor80!) }, 0.05, 150).power
    expect(at).toBeGreaterThan(0.68)
    expect(at).toBeLessThan(0.93)
  })
  test('uses t critical values, so tiny studies are not told they need a handful of units', () => {
    const r = estimatePower({ ...base, unitsPerGroup: 5, effectSize: 3 }, 0.05, 150)
    expect(r.unitsPerGroupFor80!).toBeGreaterThanOrEqual(2)
    // 10 clusters -> 9 df: t(.975) + t(.80) = 2.2622 + 0.8834 = 3.1456 (scipy), well above the normal 2.80.
    expect(r.minDetectableEffect / r.meanSe).toBeCloseTo(3.1456, 3)
  })
  test('work is bounded for large designs', () => {
    expect(repsFor({ unitsPerGroup: 500, periods: 60 })).toBe(40)
    expect(repsFor({ unitsPerGroup: 2, periods: 2 })).toBe(200)
  })
})
