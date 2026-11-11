import type { SimParams } from '../stats'

/** A saved sandbox experiment. Only inputs are stored: data is regenerated from `params` (seeded). */
export interface Experiment {
  id: string
  name: string
  hypothesis: string
  params: SimParams
  createdAt: string
}

export interface PersistedState {
  schemaVersion: 1
  experiments: Experiment[]
  walkthroughSeen: boolean
}
