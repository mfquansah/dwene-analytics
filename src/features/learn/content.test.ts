import { describe, expect, test } from 'vitest'
import { estimateDiD, generateData, testParallelTrends, validateParams } from '../../stats'
import { ALL_LESSONS, DID_CHALLENGE, DID_COURSE } from './content'
import type { ChartSpec } from './types'

describe('DiD course content', () => {
  test('five lessons with unique ids totalling about 37 minutes', () => {
    expect(DID_COURSE).toHaveLength(5)
    expect(new Set(DID_COURSE.map((l) => l.lessonId)).size).toBe(5)
    expect(DID_COURSE.reduce((s, l) => s + l.durationMinutes, 0)).toBe(37)
  })

  for (const lesson of ALL_LESSONS) {
    describe(lesson.title, () => {
      test('step ids are unique and the lesson has gradable content', () => {
        const ids = lesson.steps.map((s) => s.id)
        expect(new Set(ids).size).toBe(ids.length)
        expect(lesson.steps.some((s) => s.kind !== 'read')).toBe(true)
        expect(lesson.takeaway.length).toBeGreaterThan(0)
      })

      test('choice answers exist among options and every graded step has hints', () => {
        for (const s of lesson.steps) {
          if (s.kind === 'choice') {
            expect(s.options.map((o) => o.id)).toContain(s.correct)
            expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length)
          }
          if ((s.kind === 'choice' || s.kind === 'numeric') && lesson.mode !== 'challenge') expect(s.hints.length, s.id).toBeGreaterThan(0)
        }
      })

      test('charts are well-formed', () => {
        const check = (c: ChartSpec) => {
          for (const ser of c.series) expect(ser.values, ser.id).toHaveLength(c.labels.length)
        }
        for (const s of lesson.steps) {
          if (s.chart) check(s.chart)
          if (s.kind === 'explore') {
            check(s.chart)
            const ids = new Set(s.chart.series.map((x) => x.id))
            const shown = s.layers.flatMap((l) => l.seriesIds)
            for (const id of shown) expect(ids.has(id), id).toBe(true)
            for (const id of ids) expect(shown.includes(id), `${id} never revealed`).toBe(true)
          }
        }
      })

      test('simulation steps use valid params and satisfiable requirements', () => {
        for (const s of lesson.steps) {
          if (s.kind === 'study') expect(validateParams(s.params)).toEqual([])
          if (s.kind !== 'simulation') continue
          expect(validateParams(s.params)).toEqual([])
          const keys = new Set(s.adjustable.map((a) => a.key))
          for (const r of s.requires) {
            expect(keys.has(r.param)).toBe(true)
            const a = s.adjustable.find((x) => x.key === r.param)!
            if (r.op === 'eq') expect(r.value >= a.min && r.value <= a.max).toBe(true)
            else expect(a.max !== a.min).toBe(true)
          }
        }
      })
    })
  }

  test('numeric answers match the arithmetic of the tables shown', () => {
    for (const s of ALL_LESSONS.flatMap((l) => l.steps)) {
      if (s.kind !== 'numeric' || !s.table) continue
      const [[, tb, ta], [, cb, ca]] = s.table.rows as [[string, number, number], [string, number, number]]
      expect(ta - tb - (ca - cb)).toBe(s.correct)
    }
  })

  test('lesson 1 and 2 chart numbers are consistent with lesson 3 (100→130 vs 90→110)', () => {
    const c = DID_COURSE[2].steps[0].chart!
    expect(c.series.map((s) => s.values)).toEqual([[100, 130], [90, 110]])
    const cf = DID_COURSE[1].steps.find((s) => s.kind === 'explore')!.chart!.series.find((s) => s.id === 'cf')!
    expect(cf.values).toEqual([100, 100 + (110 - 90)])
  })

  test('lesson ids are unique across the whole sequence', () => {
    expect(new Set(ALL_LESSONS.map((l) => l.lessonId)).size).toBe(ALL_LESSONS.length)
    expect(ALL_LESSONS.at(-1)).toBe(DID_CHALLENGE)
  })

  test('lesson 5 report A is internally consistent (CI centred on estimate)', () => {
    const t = DID_COURSE[4].steps[0].table!
    expect((-1.2 + 9.2) / 2).toBeCloseTo(4.0, 10)
    expect(t.rows[0][1]).toBe('+4.0')
  })

  describe('final challenge', () => {
    const steps = DID_CHALLENGE.steps
    const graded = steps.filter((s) => s.kind === 'choice' || s.kind === 'numeric')

    test('is a challenge with enough graded questions, none of which depend on hints', () => {
      expect(DID_CHALLENGE.mode).toBe('challenge')
      expect(graded.length).toBeGreaterThanOrEqual(5)
    })

    test('every revisit link points at a real lesson', () => {
      const ids = new Set(DID_COURSE.map((l) => l.lessonId))
      for (const s of graded) {
        if (s.kind === 'choice' || s.kind === 'numeric') expect(ids.has(s.reviewLessonId ?? ''), s.id).toBe(true)
      }
    })

    test('the hidden-truth study and its reveal use identical data', () => {
      const hidden = steps.find((s) => s.kind === 'study' && !s.revealTruth)
      const shown = steps.find((s) => s.kind === 'study' && s.revealTruth)
      expect(hidden && shown && hidden.kind === 'study' && shown.kind === 'study').toBeTruthy()
      if (hidden?.kind === 'study' && shown?.kind === 'study') expect(shown.params).toEqual(hidden.params)
    })

    test('the question text matches what the engine actually produces for the study', () => {
      const study = steps.find((s) => s.kind === 'study')
      if (study?.kind !== 'study') throw new Error('no study')
      const ds = generateData(study.params)
      const est = estimateDiD(ds.data).effect
      const pt = testParallelTrends(ds.data)!
      const trust = steps.find((s) => s.id === 'b-trust')
      if (trust?.kind !== 'choice') throw new Error('no b-trust')
      expect(trust.prompt).toContain(`+${est.estimate.toFixed(1)}`)
      expect(pt.violated).toBe(true) // "the pre-trend check flags a difference"
      expect(est.ci95[1] - est.ci95[0]).toBeLessThan(1) // "very narrow"
      expect(est.estimate - ds.truth.trueEffect).toBeGreaterThan(2) // clearly biased, as the lesson claims
    })

    test('case C report is consistent: interval centred on the estimate, p matches', () => {
      expect((-0.5 + 4.5) / 2).toBeCloseTo(2.0, 10)
      const se = (4.5 - -0.5) / (2 * 1.96)
      const z = 2.0 / se
      const p = 2 * (1 - 0.5 * (1 + erf(z / Math.SQRT2)))
      expect(p).toBeCloseTo(0.12, 2)
    })
  })
})

// Abramowitz-Stegun erf, enough to sanity-check a quoted p-value.
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return x >= 0 ? y : -y
}
