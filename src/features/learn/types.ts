import type { SimParams } from '../../stats'

/** Lessons are data, not pages: the player renders any Lesson, so new courses need no new UI. */

export interface TableSpec {
  columns: string[]
  rows: Array<Array<string | number>>
}

export interface ChartSeries {
  id: string
  label: string
  /** One value per label; null leaves a gap. */
  values: Array<number | null>
  style: 'treated' | 'comparison' | 'counterfactual'
}

export interface ChartSpec {
  labels: string[]
  series: ChartSeries[]
  yDomain?: [number, number]
  yLabel?: string
}

/** Shared optional visuals any step can show beside its prompt. */
interface Visuals {
  table?: TableSpec
  chart?: ChartSpec
}

interface StepBase extends Visuals {
  id: string
  title: string
}

/** Plain explanation. Completes when the learner continues. */
export interface ReadStep extends StepBase {
  kind: 'read'
  body: string[]
}

export interface ChoiceStep extends StepBase {
  kind: 'choice'
  prompt: string
  options: Array<{ id: string; label: string }>
  correct: string
  /** Progressive hints, shown one per wrong attempt. */
  hints: string[]
  explanation: string
  /** Challenge only: the lesson to revisit if this is missed. */
  reviewLessonId?: string
}

export interface NumericStep extends StepBase {
  kind: 'numeric'
  prompt: string
  correct: number
  /** Accepted absolute error. */
  tolerance: number
  unit?: string
  hints: string[]
  explanation: string
  reviewLessonId?: string
}

export interface ExploreLayer {
  id: string
  label: string
  seriesIds: string[]
  /** Shown once the layer is revealed. */
  note: string
}

/** Interactive chart: the learner reveals layers one by one. Completes when all are revealed. */
export interface ExploreStep extends StepBase {
  kind: 'explore'
  prompt: string
  chart: ChartSpec
  layers: ExploreLayer[]
}

export interface SimAdjustable {
  key: 'effectSize' | 'noise' | 'baselineDifference' | 'trendDifference'
  label: string
  min: number
  max: number
  step: number
  help: string
}

/** The learner must have tried a value satisfying each requirement. */
export interface Requirement {
  param: SimAdjustable['key']
  op: 'eq' | 'ne'
  value: number
  /** Shown while unmet. */
  label: string
}

/** Runs the real simulation and DiD engine with learner-adjustable assumptions. */
export interface SimulationStep extends StepBase {
  kind: 'simulation'
  prompt: string
  params: SimParams
  adjustable: SimAdjustable[]
  requires: Requirement[]
  explanation: string
}

/** A live simulated study shown as a real analyst would see it. Hides the truth unless `revealTruth`. */
export interface StudyStep extends StepBase {
  kind: 'study'
  body: string[]
  params: SimParams
  revealTruth: boolean
}

export type Step = StudyStep | ReadStep | ChoiceStep | NumericStep | ExploreStep | SimulationStep

export interface Lesson {
  lessonId: string
  /** 'challenge': no hints, scored on first attempts. */
  mode?: 'lesson' | 'challenge'
  title: string
  durationMinutes: number
  objective: string
  scenario: string
  concepts: Array<{ term: string; definition: string }>
  /** Completion rule: a lesson is complete when every step has a recorded status. */
  steps: Step[]
  takeaway: string
  /** Offered as "explore this scenario in the Lab". */
  sandboxPreset?: Partial<SimParams>
}
