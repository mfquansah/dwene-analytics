import type { Lesson } from '../types'
import { DID_CHALLENGE } from './didChallenge'
import { DID_COURSE } from './didCourse'

export { DID_CHALLENGE, DID_COURSE }
/** Everything the player can open, in order. */
export const ALL_LESSONS: Lesson[] = [...DID_COURSE, DID_CHALLENGE]
