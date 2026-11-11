import { describe, expect, test } from 'vitest'
import { validateParams } from '../../stats'
import { DID_COURSE, lesson3 } from './content/didCourse'
import type { ChartSpec } from './types'

describe('DiD course content', () => {
  test('five lessons with unique ids totalling about 37 minutes', () => {
    expect(DID_COURSE).toHaveLength(5)
    expect(new Set(DID_COURSE.map((l) => l.lessonId)).size).toBe(5)
    expect(DID_COURSE.reduce((s, l) => s + l.durationMinutes, 0)).toBe(37)
  })

  for (const lesson of DID_COURSE) {
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
          if (s.kind === 'choice' || s.kind === 'numeric') expect(s.hints.length, s.id).toBeGreaterThan(0)
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
    for (const s of lesson3.steps) {
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

  test('lesson 5 report A is internally consistent (CI centred on estimate)', () => {
    const t = DID_COURSE[4].steps[0].table!
    expect((-1.2 + 9.2) / 2).toBeCloseTo(4.0, 10)
    expect(t.rows[0][1]).toBe('+4.0')
  })
})
