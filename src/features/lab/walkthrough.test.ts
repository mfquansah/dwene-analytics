import { expect, test } from 'vitest'
import { FIELDS } from './fields'
import { TOUR_STEPS } from './walkthrough'

test('every walkthrough target exists in the designer form', () => {
  const keys = new Set<string>([...FIELDS.map((f) => f.key), 'run'])
  for (const s of TOUR_STEPS) for (const t of s.targets) expect(keys.has(t), t).toBe(true)
})
test('walkthrough steps all have copy', () => {
  for (const s of TOUR_STEPS) { expect(s.title.length).toBeGreaterThan(0); expect(s.body.length).toBeGreaterThan(0) }
})
