import type { StepStatus } from '../../storage/types'
import type { ChoiceStep, Lesson, NumericStep, Requirement, SimulationStep } from './types'

export function gradeChoice(step: ChoiceStep, answerId: string): boolean {
  return answerId === step.correct
}

/** Accepts "10", "+10", " 10.0 ". Returns null for anything that is not a finite number. */
export function parseNumber(raw: string): number | null {
  const t = raw.trim().replace(/^\+/, '')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function gradeNumeric(step: NumericStep, value: number): boolean {
  return Math.abs(value - step.correct) <= step.tolerance
}

/** Hint for the nth wrong attempt (1-based). Repeats the last hint once they run out. */
export function hintFor(hints: string[], wrongAttempts: number): string | null {
  if (wrongAttempts < 1 || hints.length === 0) return null
  return hints[Math.min(wrongAttempts, hints.length) - 1]
}

/** Offer to reveal the answer only after every hint has been shown. */
export function canReveal(hints: string[], wrongAttempts: number): boolean {
  return wrongAttempts > hints.length
}

export function requirementMet(r: Requirement, seen: Array<Record<string, number>>): boolean {
  return seen.some((v) => (r.op === 'eq' ? v[r.param] === r.value : v[r.param] !== r.value))
}

export function simulationComplete(step: SimulationStep, seen: Array<Record<string, number>>): boolean {
  return step.requires.every((r) => requirementMet(r, seen))
}

export const isLessonComplete = (lesson: Lesson, steps: Record<string, StepStatus> | undefined): boolean =>
  lesson.steps.every((s) => steps?.[s.id] !== undefined)

/** Index of the first step with no recorded status (or the last step if all are done). */
export function firstIncomplete(lesson: Lesson, steps: Record<string, StepStatus> | undefined): number {
  const i = lesson.steps.findIndex((s) => steps?.[s.id] === undefined)
  return i === -1 ? lesson.steps.length - 1 : i
}
