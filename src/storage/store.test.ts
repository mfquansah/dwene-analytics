import { describe, expect, test } from 'vitest'
import { parseState } from './store'

describe('parseState', () => {
  test('empty / corrupt / wrong-version input yields empty state', () => {
    for (const raw of [null, '', 'not json', '{}', '{"schemaVersion":2,"experiments":[]}', '{"schemaVersion":1}']) {
      expect(parseState(raw)).toEqual({ schemaVersion: 1, experiments: [], walkthroughSeen: false, lessonProgress: {} })
    }
  })
  test('keeps valid experiments and drops malformed ones', () => {
    const good = { id: 'a', name: 'A', hypothesis: '', params: { seed: 1 }, createdAt: 'x' }
    const raw = JSON.stringify({ schemaVersion: 1, experiments: [good, { id: 5 }, null], walkthroughSeen: true })
    const s = parseState(raw)
    expect(s.experiments).toEqual([good])
    expect(s.walkthroughSeen).toBe(true)
  })
  test('keeps valid lesson progress, drops unknown statuses and malformed entries', () => {
    const raw = JSON.stringify({
      schemaVersion: 1, experiments: [],
      lessonProgress: { l3: { steps: { a: 'correct', b: 'bogus', c: 'revealed', d: 'first-try' } }, l4: 'nope', l5: null },
    })
    expect(parseState(raw).lessonProgress).toEqual({ l3: { steps: { a: 'correct', c: 'revealed', d: 'first-try' } } })
  })
  test('state saved before lesson progress existed still loads', () => {
    expect(parseState('{"schemaVersion":1,"experiments":[]}').lessonProgress).toEqual({})
  })
})
