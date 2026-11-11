import type { SimParams } from '../stats'

/** A saved sandbox experiment. Only inputs are stored: data is regenerated from `params` (seeded). */
export interface Experiment {
  id: string
  name: string
  hypothesis: string
  params: SimParams
  createdAt: string
}

/**
 * 'first-try' = right on the first attempt (challenge scoring); 'correct' = right after retries;
 * 'revealed' = learner asked to see the answer; 'done' = read/explored step finished.
 */
export type StepStatus = 'first-try' | 'correct' | 'revealed' | 'done'

export interface LessonProgress {
  steps: Record<string, StepStatus>
}

export interface PersistedState {
  schemaVersion: 1
  experiments: Experiment[]
  walkthroughSeen: boolean
  lessonProgress: Record<string, LessonProgress>
}
