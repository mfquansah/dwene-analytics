import { expect, test } from 'vitest'
import { canReveal, canRevealInChallenge, challengeScore, firstIncomplete, gradeChoice, gradeNumeric, hintFor, isLessonComplete, parseNumber, requirementMet, simulationComplete } from './grading'
import type { ChoiceStep, Lesson, NumericStep, SimulationStep } from './types'

const num = { kind: 'numeric', id: 'n', title: '', prompt: '', correct: 10, tolerance: 0.5, hints: [], explanation: '' } as NumericStep
const choice = { kind: 'choice', id: 'c', title: '', prompt: '', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correct: 'b', hints: [], explanation: '' } as ChoiceStep

test('parseNumber accepts signs and whitespace, rejects junk', () => {
  expect(parseNumber('+10')).toBe(10)
  expect(parseNumber(' -2.5 ')).toBe(-2.5)
  for (const bad of ['', '  ', 'abc', '1,5', 'Infinity', 'NaN']) expect(parseNumber(bad)).toBeNull()
})

test('numeric grading respects tolerance', () => {
  expect(gradeNumeric(num, 10)).toBe(true)
  expect(gradeNumeric(num, 10.5)).toBe(true)
  expect(gradeNumeric(num, 9.4)).toBe(false)
  expect(gradeNumeric(num, 30)).toBe(false)
})

test('choice grading', () => {
  expect(gradeChoice(choice, 'b')).toBe(true)
  expect(gradeChoice(choice, 'a')).toBe(false)
})

test('hints escalate one per wrong attempt, repeat the last, and reveal only after all hints', () => {
  const hints = ['h1', 'h2']
  expect(hintFor(hints, 0)).toBeNull()
  expect(hintFor(hints, 1)).toBe('h1')
  expect(hintFor(hints, 2)).toBe('h2')
  expect(hintFor(hints, 5)).toBe('h2')
  expect(hintFor([], 3)).toBeNull()
  expect(canReveal(hints, 2)).toBe(false)
  expect(canReveal(hints, 3)).toBe(true)
  expect(canReveal([], 1)).toBe(true)
})

test('simulation requirements need both a zero and a non-zero value to have been tried', () => {
  const step = { requires: [
    { param: 'trendDifference', op: 'eq', value: 0, label: '' },
    { param: 'trendDifference', op: 'ne', value: 0, label: '' },
  ] } as SimulationStep
  expect(requirementMet(step.requires[0], [])).toBe(false)
  expect(simulationComplete(step, [{ trendDifference: 0 }])).toBe(false)
  expect(simulationComplete(step, [{ trendDifference: 0.3 }])).toBe(false)
  expect(simulationComplete(step, [{ trendDifference: 0 }, { trendDifference: 0.3 }])).toBe(true)
})

test('lesson completion and resume point', () => {
  const lesson = { steps: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } as unknown as Lesson
  expect(isLessonComplete(lesson, undefined)).toBe(false)
  expect(firstIncomplete(lesson, undefined)).toBe(0)
  expect(firstIncomplete(lesson, { a: 'done', b: 'correct' })).toBe(2)
  expect(isLessonComplete(lesson, { a: 'done', b: 'correct' })).toBe(false)
  expect(isLessonComplete(lesson, { a: 'done', b: 'correct', c: 'revealed' })).toBe(true)
  expect(firstIncomplete(lesson, { a: 'done', b: 'correct', c: 'revealed' })).toBe(2)
})

test('challenge scoring counts only first-try answers and lists the misses', () => {
  const lesson = { steps: [
    { id: 'i', kind: 'read' }, { id: 'a', kind: 'choice' }, { id: 'b', kind: 'numeric' }, { id: 'c', kind: 'choice' }, { id: 's', kind: 'study' },
  ] } as unknown as Lesson
  const r = challengeScore(lesson, { i: 'done', a: 'first-try', b: 'correct', c: 'revealed', s: 'done' })
  expect(r.graded).toBe(3)
  expect(r.firstTry).toBe(1)
  expect(r.missed.map((m) => m.id)).toEqual(['b', 'c'])
  expect(challengeScore(lesson, undefined).firstTry).toBe(0)
})

test('challenge reveal is offered only after two misses', () => {
  expect([0, 1, 2, 3].map(canRevealInChallenge)).toEqual([false, false, true, true])
})
