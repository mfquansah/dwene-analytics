import { describe, expect, test } from 'vitest'
import fixtures from './__fixtures__/statsmodels.json'
import { tCdf, tQuantile } from './distributions'
import { cellMeans, estimateDiD, generateData, testParallelTrends, createRng } from './index'
import { olsClustered } from './ols'
import type { Observation, SimParams } from './types'

const base: SimParams = {
  unitsPerGroup: 30,
  periods: 8,
  treatmentStart: 4,
  effectSize: 2,
  noise: 1,
  baselineDifference: 3,
  trendDifference: 0,
  seed: 1,
}

describe('rng', () => {
  test('is deterministic per seed and differs across seeds', () => {
    const a = createRng(7), b = createRng(7), c = createRng(8)
    const xs = Array.from({ length: 5 }, () => a.normal())
    expect(Array.from({ length: 5 }, () => b.normal())).toEqual(xs)
    expect(Array.from({ length: 5 }, () => c.normal())).not.toEqual(xs)
  })
  test('normal draws have mean ~0 and SD ~1', () => {
    const r = createRng(42)
    const xs = Array.from({ length: 50000 }, () => r.normal())
    const m = xs.reduce((s, v) => s + v, 0) / xs.length
    const sd = Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length)
    expect(Math.abs(m)).toBeLessThan(0.02)
    expect(Math.abs(sd - 1)).toBeLessThan(0.02)
  })
})

describe('t distribution vs scipy', () => {
  for (const [df, ref] of Object.entries(fixtures.t)) {
    test(`df=${df}`, () => {
      const d = Number(df)
      expect(tQuantile(0.975, d)).toBeCloseTo(ref.q975, 6)
      expect(tQuantile(0.9, d)).toBeCloseTo(ref.q90, 6)
      expect(tCdf(1.5, d)).toBeCloseTo(ref.cdf_1_5, 9)
      expect(tCdf(-2, d)).toBeCloseTo(ref.cdf_neg_2, 9)
    })
  }
})

describe('generateData', () => {
  test('is reproducible and balanced', () => {
    const a = generateData(base), b = generateData(base)
    expect(a.data).toEqual(b.data)
    expect(a.data).toHaveLength(2 * 30 * 8)
    expect(a.data.filter((o) => o.treated === 1)).toHaveLength(30 * 8)
    expect(a.data.every((o) => o.post === (o.period >= 4 ? 1 : 0))).toBe(true)
  })
  test('different seeds give different data', () => {
    expect(generateData({ ...base, seed: 2 }).data[0].y).not.toBe(generateData(base).data[0].y)
  })
  test('rejects invalid parameters', () => {
    expect(() => generateData({ ...base, treatmentStart: 0 })).toThrow()
    expect(() => generateData({ ...base, treatmentStart: 8 })).toThrow()
    expect(() => generateData({ ...base, unitsPerGroup: 1 })).toThrow()
    expect(() => generateData({ ...base, noise: -1 })).toThrow()
    expect(() => generateData({ ...base, effectSize: NaN })).toThrow()
  })
  test('with zero noise the estimator recovers the effect exactly', () => {
    const { data } = generateData({ ...base, noise: 0 })
    expect(cellMeans(data).did).toBeCloseTo(2, 10)
    expect(estimateDiD(data).effect.estimate).toBeCloseTo(2, 10)
  })
  test('truth exposes the counterfactual', () => {
    const { truth } = generateData(base)
    expect(truth.expected.treated[5] - truth.expected.treatedCounterfactual[5]).toBeCloseTo(2)
    expect(truth.expected.treated[2]).toBeCloseTo(truth.expected.treatedCounterfactual[2])
  })
})

describe('estimateDiD vs statsmodels (identical rows)', () => {
  for (const [name, sc] of Object.entries(fixtures.scenarios)) {
    test(name, () => {
      const rows = sc.rows as Observation[]
      const r = estimateDiD(rows)
      expect(r.effect.estimate).toBeCloseTo(sc.did.params[3], 8)
      expect(r.effect.se).toBeCloseTo(sc.did.se[3], 8)
      expect(r.effect.p).toBeCloseTo(sc.did.p[3], 8)
      expect(r.effect.ci95[0]).toBeCloseTo(sc.did.ci[3][0], 8)
      expect(r.effect.ci95[1]).toBeCloseTo(sc.did.ci[3][1], 8)
      // Inference uses t with (clusters - 1) df; statsmodels' use_t=True does the same.
      expect(r.df).toBe(r.nUnits - 1)
      // Saturated model: regression coefficient equals the 2x2 means DiD.
      expect(r.means.did).toBeCloseTo(r.effect.estimate, 8)
    })
    test(`${name}: parallel-trends regression`, () => {
      const pt = testParallelTrends(sc.rows as Observation[])!
      expect(pt.slopeDifference.estimate).toBeCloseTo(sc.parallel_trends.params[3], 8)
      expect(pt.slopeDifference.se).toBeCloseTo(sc.parallel_trends.se[3], 8)
      expect(pt.slopeDifference.p).toBeCloseTo(sc.parallel_trends.p[3], 8)
    })
  }
})

describe('statistical properties (fixed seeds)', () => {
  test('recovers a known true effect on average and covers it ~95% of the time', () => {
    const reps = 400
    let sum = 0, covered = 0
    for (let s = 0; s < reps; s++) {
      const { data } = generateData({ ...base, seed: 1000 + s, unitEffectSd: 1.5 })
      const r = estimateDiD(data)
      sum += r.effect.estimate
      if (r.effect.ci95[0] <= 2 && 2 <= r.effect.ci95[1]) covered++
    }
    expect(Math.abs(sum / reps - 2)).toBeLessThan(0.1)
    const coverage = covered / reps
    expect(coverage).toBeGreaterThan(0.92)
    expect(coverage).toBeLessThan(0.98)
  })

  test('each single run lands within 4 SEs of the truth (no wild misses)', () => {
    for (let s = 0; s < 50; s++) {
      const r = estimateDiD(generateData({ ...base, seed: 5000 + s }).data)
      expect(Math.abs(r.effect.estimate - 2)).toBeLessThan(4 * r.effect.se)
    }
  })

  test('baseline level difference does not bias the estimate', () => {
    const run = (d: number) => {
      let sum = 0
      for (let s = 0; s < 200; s++) sum += estimateDiD(generateData({ ...base, baselineDifference: d, seed: 9000 + s }).data).effect.estimate
      return sum / 200
    }
    // Same noise stream, constant level shift on treated units: estimates must be identical.
    expect(Math.abs(run(0) - run(25))).toBeLessThan(1e-8)
  })

  test('a trend difference biases DiD by the documented amount', () => {
    const p = { ...base, trendDifference: 0.4, noise: 0 }
    const ds = generateData(p)
    expect(estimateDiD(ds.data).effect.estimate).toBeCloseTo(2 + ds.truth.expectedBias, 10)
    expect(ds.truth.expectedBias).toBeCloseTo(0.4 * 4, 10) // post mean t=5.5, pre mean t=1.5
  })

  test('power: a real effect is usually detected, a null effect rarely is', () => {
    let hitsEffect = 0, hitsNull = 0
    const reps = 200
    for (let s = 0; s < reps; s++) {
      if (estimateDiD(generateData({ ...base, seed: 20000 + s }).data).effect.p < 0.05) hitsEffect++
      if (estimateDiD(generateData({ ...base, effectSize: 0, seed: 30000 + s }).data).effect.p < 0.05) hitsNull++
    }
    expect(hitsEffect / reps).toBeGreaterThan(0.9)
    expect(hitsNull / reps).toBeLessThan(0.09)
  })
})

describe('parallel-trends diagnostic', () => {
  const rate = (trendDifference: number) => {
    let flagged = 0
    const reps = 200
    for (let s = 0; s < reps; s++) {
      const { data } = generateData({ ...base, periods: 10, treatmentStart: 6, trendDifference, seed: 40000 + s })
      if (testParallelTrends(data)!.violated) flagged++
    }
    return flagged / reps
  }
  test('rarely flags when trends are parallel (~ alpha)', () => {
    expect(rate(0)).toBeLessThan(0.1)
  })
  test('usually flags when a clear trend difference is injected', () => {
    expect(rate(0.5)).toBeGreaterThan(0.9)
  })
  test('returns null with fewer than 2 pre periods', () => {
    const { data } = generateData({ ...base, treatmentStart: 1 })
    expect(testParallelTrends(data)).toBeNull()
  })
})

describe('ols guards', () => {
  test('throws on collinear design', () => {
    expect(() => olsClustered([[1, 2], [1, 2], [1, 2]], [1, 2, 3], [0, 1, 2])).toThrow(/singular/)
  })
  test('throws with a single cluster', () => {
    expect(() => olsClustered([[1, 0], [1, 1], [1, 2]], [1, 2, 3], [0, 0, 0])).toThrow(/2 clusters/)
  })
  test('cellMeans throws when a cell is empty', () => {
    const only: Observation[] = [{ unit: 0, period: 0, treated: 0, post: 0, y: 1 }]
    expect(() => cellMeans(only)).toThrow()
  })
})
