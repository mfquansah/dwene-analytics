import { useSyncExternalStore } from 'react'
import type { Experiment, PersistedState } from './types'

export const STORAGE_KEY = 'dwene:state'
const empty = (): PersistedState => ({ schemaVersion: 1, experiments: [], walkthroughSeen: false })

/** Parse and validate stored JSON. Anything unrecognised falls back to an empty state. */
export function parseState(raw: string | null): PersistedState {
  if (!raw) return empty()
  try {
    const v = JSON.parse(raw)
    if (v?.schemaVersion !== 1 || !Array.isArray(v.experiments)) return empty()
    const experiments = v.experiments.filter(
      (e: Experiment) => typeof e?.id === 'string' && typeof e?.name === 'string' && typeof e?.params === 'object' && e.params !== null,
    )
    return { schemaVersion: 1, experiments, walkthroughSeen: v.walkthroughSeen === true }
  } catch {
    return empty()
  }
}

function read(): PersistedState {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY))
  } catch {
    return empty() // storage unavailable (private mode, blocked)
  }
}

let state: PersistedState = read()
const listeners = new Set<() => void>()

function commit(next: PersistedState) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Quota or blocked storage: keep working in memory for this session.
  }
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  addExperiment(e: Experiment) {
    commit({ ...state, experiments: [e, ...state.experiments] })
  },
  deleteExperiment(id: string) {
    commit({ ...state, experiments: state.experiments.filter((e) => e.id !== id) })
  },
  setWalkthroughSeen(seen: boolean) {
    commit({ ...state, walkthroughSeen: seen })
  },
}

export function useAppState(): PersistedState {
  return useSyncExternalStore(store.subscribe, store.get)
}
