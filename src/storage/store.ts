import { useSyncExternalStore } from 'react'
import type { Experiment, LessonProgress, PersistedState, StepStatus } from './types'

export const STORAGE_KEY = 'dwene:state'
const empty = (): PersistedState => ({ schemaVersion: 1, experiments: [], walkthroughSeen: false, lessonProgress: {} })

const STATUSES = new Set<StepStatus>(['first-try', 'correct', 'revealed', 'done'])

function parseProgress(raw: unknown): Record<string, LessonProgress> {
  const out: Record<string, LessonProgress> = {}
  if (typeof raw !== 'object' || raw === null) return out
  for (const [lessonId, lp] of Object.entries(raw as Record<string, { steps?: unknown }>)) {
    if (typeof lp?.steps !== 'object' || lp.steps === null) continue
    const steps: Record<string, StepStatus> = {}
    for (const [stepId, st] of Object.entries(lp.steps)) if (STATUSES.has(st as StepStatus)) steps[stepId] = st as StepStatus
    out[lessonId] = { steps }
  }
  return out
}

/** Parse and validate stored JSON. Anything unrecognised falls back to an empty state. */
export function parseState(raw: string | null): PersistedState {
  if (!raw) return empty()
  try {
    const v = JSON.parse(raw)
    if (v?.schemaVersion !== 1 || !Array.isArray(v.experiments)) return empty()
    const experiments = v.experiments.filter(
      (e: Experiment) => typeof e?.id === 'string' && typeof e?.name === 'string' && typeof e?.params === 'object' && e.params !== null,
    )
    return { schemaVersion: 1, experiments, walkthroughSeen: v.walkthroughSeen === true, lessonProgress: parseProgress(v.lessonProgress) }
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
  recordStep(lessonId: string, stepId: string, status: StepStatus) {
    const prev = state.lessonProgress[lessonId]?.steps ?? {}
    commit({ ...state, lessonProgress: { ...state.lessonProgress, [lessonId]: { steps: { ...prev, [stepId]: status } } } })
  },
  resetLesson(lessonId: string) {
    const { [lessonId]: _removed, ...rest } = state.lessonProgress
    commit({ ...state, lessonProgress: rest })
  },
  setWalkthroughSeen(seen: boolean) {
    commit({ ...state, walkthroughSeen: seen })
  },
}

export function useAppState(): PersistedState {
  return useSyncExternalStore(store.subscribe, store.get)
}
