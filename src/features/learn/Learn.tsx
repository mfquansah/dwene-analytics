import { Link } from 'react-router-dom'
import { useAppState } from '../../storage/store'
import { DID_CHALLENGE, DID_COURSE } from './content'
import { challengeScore, isLessonComplete } from './grading'

export function Learn() {
  const { lessonProgress } = useAppState()
  const complete = DID_COURSE.filter((l) => isLessonComplete(l, lessonProgress[l.lessonId]?.steps)).length
  const minutes = DID_COURSE.reduce((s, l) => s + l.durationMinutes, 0)
  return (
    <div className="page narrow">
      <h1>Learn difference-in-differences</h1>
      <p className="muted">Five short lessons. Each starts with a real problem, asks you to decide, lets you experiment, then explains. About {minutes} minutes in total. {complete} of {DID_COURSE.length} complete.</p>
      <ol className="lessons">
        {DID_COURSE.map((l, i) => {
          const steps = lessonProgress[l.lessonId]?.steps ?? {}
          const count = l.steps.filter((s) => steps[s.id]).length
          const isDone = isLessonComplete(l, steps)
          const label = isDone ? 'Review' : count > 0 ? 'Continue' : 'Start'
          return (
            <li key={l.lessonId} className="card lesson-card">
              <div>
                <div className="muted small">Lesson {i + 1} · {l.durationMinutes} min · {isDone ? 'Complete' : count > 0 ? `${count} of ${l.steps.length} steps` : 'Not started'}</div>
                <h2>{l.title}</h2>
                <p className="muted">{l.objective}</p>
              </div>
              <Link to={`/learn/${l.lessonId}`} className={`btn ${isDone ? 'ghost' : 'primary'}`}>{label}</Link>
            </li>
          )
        })}
      </ol>
      <Challenge />
    </div>
  )
}

function Challenge() {
  const { lessonProgress } = useAppState()
  const steps = lessonProgress[DID_CHALLENGE.lessonId]?.steps ?? {}
  const count = DID_CHALLENGE.steps.filter((s) => steps[s.id]).length
  const isDone = isLessonComplete(DID_CHALLENGE, steps)
  const score = challengeScore(DID_CHALLENGE, steps)
  const course = DID_COURSE.filter((l) => isLessonComplete(l, lessonProgress[l.lessonId]?.steps)).length
  const status = isDone ? `Complete: ${score.firstTry} of ${score.graded} on the first try` : count > 0 ? `${count} of ${DID_CHALLENGE.steps.length} steps` : course === DID_COURSE.length ? 'Ready' : 'Best after lesson 5'
  return (
    <section className="card lesson-card challenge-card" aria-labelledby="challenge-title">
      <div>
        <div className="muted small">Final challenge · {DID_CHALLENGE.durationMinutes} min · {status}</div>
        <h2 id="challenge-title">{DID_CHALLENGE.title}</h2>
        <p className="muted">{DID_CHALLENGE.objective}</p>
      </div>
      <Link to={`/learn/${DID_CHALLENGE.lessonId}`} className={`btn ${isDone ? 'ghost' : 'primary'}`}>{isDone ? 'Review' : count > 0 ? 'Continue' : 'Start'}</Link>
    </section>
  )
}
