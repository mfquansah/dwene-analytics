import { describe, expect, test } from 'vitest'
import { histogram, repeatsFor, repeatStudy } from './repeat'
import type { SimParams } from './types'

const base: SimParams = { unitsPerGroup: 20, periods: 12, treatmentStart: 6, effectSize: 2, noise: 1.5, baselineDifference: 3, trendDifference: 0, seed: 5 }

describe('repeatStudy', () => {
  const r = repeatStudy(base, 400)
  test('is deterministic', () => expect(repeatStudy(base, 50)).toEqual(repeatStudy(base, 50)))
  test('estimates centre on the true effect and spread matches their own SD', () => {
    expect(r.estimates).toHaveLength(400)
    expect(Math.abs(r.mean - 2)).toBeLessThan(0.1)
    expect(r.sd).toBeGreaterThan(0.1)
  })
  test('95% intervals cover the truth about 95% of the time', () => {
    expect(r.coverage).toBeGreaterThan(0.92)
    expect(r.coverage).toBeLessThan(0.985)
  })
  test('a trend difference shifts the whole distribution away from the truth and destroys coverage', () => {
    const biased = repeatStudy({ ...base, trendDifference: 0.4 }, 200)
    expect(biased.mean - 2).toBeGreaterThan(1.5)
    expect(biased.coverage).toBeLessThan(0.2)
  })
  test('run count is bounded', () => {
    expect(repeatsFor({ unitsPerGroup: 500, periods: 60 })).toBe(100)
    expect(repeatsFor({ unitsPerGroup: 2, periods: 2 })).toBe(1000)
  })
})

describe('histogram', () => {
  test('counts every value exactly once, including the maximum', () => {
    const h = histogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(11)
    expect(h[4].count).toBe(3) // 8, 9, 10
  })
  test('respects an explicit range and ignores values outside it', () => {
    expect(histogram([-5, 0.5, 1.5, 99], 2, [0, 2]).map((b) => b.count)).toEqual([1, 1])
  })
  test('handles identical values and empty input', () => {
    expect(histogram([3, 3, 3], 4).reduce((s, b) => s + b.count, 0)).toBe(3)
    expect(histogram([], 4)).toEqual([])
  })
})
