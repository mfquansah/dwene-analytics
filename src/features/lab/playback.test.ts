import { describe, expect, test } from 'vitest'
import { estimateDiD, generateData, type SimParams } from '../../stats'
import { interimAt, interimResults, msPerPeriod, peeksBelow } from './playback'

const p: SimParams = { unitsPerGroup: 20, periods: 12, treatmentStart: 6, effectSize: 2, noise: 1.5, baselineDifference: 3, trendDifference: 0, seed: 123 }

describe('interim results', () => {
  const ds = generateData(p)
  const r = interimResults(ds.data, p.treatmentStart, p.periods)

  test('one result per post-treatment period, starting at treatment start', () => {
    expect(r.map((x) => x.upTo)).toEqual([6, 7, 8, 9, 10, 11])
  })
  test('the final interim result equals the full-data estimate', () => {
    const full = estimateDiD(ds.data).effect
    expect(r.at(-1)!.estimate).toBeCloseTo(full.estimate, 10)
    expect(r.at(-1)!.p).toBeCloseTo(full.p, 10)
  })
  test('interim results use only data observed so far (no look-ahead)', () => {
    const early = estimateDiD(ds.data.filter((o) => o.period <= 6)).effect.estimate
    expect(r[0].estimate).toBeCloseTo(early, 10)
    // Changing a future observation must not change an earlier interim result.
    const tampered = ds.data.map((o) => (o.period === 11 ? { ...o, y: o.y + 100 } : o))
    expect(interimResults(tampered, 6, 12)[0].estimate).toBeCloseTo(r[0].estimate, 10)
  })
  test('interimAt is null before treatment starts', () => {
    expect(interimAt(r, 3)).toBeNull()
    expect(interimAt(r, 8)!.upTo).toBe(8)
  })
})

describe('peeking', () => {
  const r = [{ upTo: 6, estimate: 1, p: 0.2 }, { upTo: 7, estimate: 1, p: 0.04 }, { upTo: 8, estimate: 1, p: 0.3 }, { upTo: 9, estimate: 1, p: 0.01 }]
  test('counts looks below alpha, only up to the current period', () => {
    expect(peeksBelow(r, 6)).toBe(0)
    expect(peeksBelow(r, 7)).toBe(1)
    expect(peeksBelow(r, 9)).toBe(2)
  })
})

test('playback speed scales inversely', () => {
  expect(msPerPeriod(4)).toBe(msPerPeriod(1) / 4)
  expect(msPerPeriod(16)).toBeLessThan(msPerPeriod(4))
})
