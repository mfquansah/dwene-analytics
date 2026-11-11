import { useState, type ReactElement } from 'react'
import { Link, useParams } from 'react-router-dom'
import { store, useAppState } from '../../storage/store'
import type { StepStatus } from '../../storage/types'
import { ALL_LESSONS } from './content'
import { challengeScore, firstIncomplete, isLessonComplete } from './grading'
import { ChoiceView, ExploreView, NumericView, ReadView, SimulationView, StudyView } from './Steps'
import type { Step } from './types'

function StepBody({ step, status, onDone, challenge }: { step: Step; status?: StepStatus; onDone: (s: StepStatus) => void; challenge: boolean }): ReactElement {
  switch (step.kind) {
    case 'read': return <ReadView step={step} status={status} onDone={onDone} />
    case 'study': return <StudyView step={step} status={status} onDone={onDone} />
    case 'choice': return <ChoiceView step={step} status={status} onDone={onDone} challenge={challenge} />
    case 'numeric': return <NumericView step={step} status={status} onDone={onDone} challenge={challenge} />
    case 'explore': return <ExploreView step={step} status={status} onDone={onDone} />
    case 'simulation': return <SimulationView step={step} status={status} onDone={onDone} />
  }
}

/** Keyed by lesson so moving between lessons always starts with fresh local state. */
export function LessonPlayer() {
  const { lessonId } = useParams()
  return <Player key={lessonId} lessonId={lessonId} />
}

function Player({ lessonId }: { lessonId: string | undefined }) {
  const lesson = ALL_LESSONS.find((l) => l.lessonId === lessonId)
  const { lessonProgress } = useAppState()
  const done = lessonProgress[lessonId ?? '']?.steps
  const [idx, setIdx] = useState(() => (lesson ? firstIncomplete(lesson, done) : 0))
  const [summary, setSummary] = useState(() => (lesson ? isLessonComplete(lesson, done) : false))

  if (!lesson) return <div className="page narrow"><h1>Lesson not found</h1><Link to="/learn" className="link">Back to the course</Link></div>
  const n = ALL_LESSONS.findIndex((l) => l.lessonId === lesson.lessonId)
  const nextLesson = ALL_LESSONS[n + 1]
  const challenge = lesson.mode === 'challenge'
  const kicker = challenge ? 'Final challenge' : `Lesson ${n + 1} of ${ALL_LESSONS.length - 1}`

  if (summary) {
    const preset = lesson.sandboxPreset && new URLSearchParams(Object.entries(lesson.sandboxPreset).map(([k, v]) => [k, String(v)])).toString()
    const assisted = lesson.steps.filter((s) => done?.[s.id] === 'revealed').length
    return (
      <div className="page narrow">
        <p className="muted small">{kicker}</p>
        <h1>{challenge ? 'Challenge complete' : `Lesson complete: ${lesson.title}`}</h1>
        {challenge && <ChallengeResult lessonId={lesson.lessonId} />}
        {!challenge && assisted > 0 && <p className="muted">You revealed {assisted} answer{assisted > 1 ? 's' : ''}. Replaying the lesson is a good way to lock them in.</p>}
        <section className="card"><h2>Key takeaway</h2><p>{lesson.takeaway}</p></section>
        <section className="card">
          <h2>Key ideas</h2>
          <dl className="concepts">{lesson.concepts.map((c) => <div key={c.term}><dt>{c.term}</dt><dd>{c.definition}</dd></div>)}</dl>
        </section>
        <div className="row wrap">
          {nextLesson && <Link className="btn primary" to={`/learn/${nextLesson.lessonId}`}>{nextLesson.mode === 'challenge' ? 'Take the final challenge' : `Next lesson: ${nextLesson.title}`}</Link>}
          {preset && <Link className="btn ghost" to={`/lab?${preset}`}>Explore this scenario in the Lab</Link>}
          <button className="btn ghost" onClick={() => { setIdx(0); setSummary(false) }}>{challenge ? 'Review your answers' : 'Review the lesson'}</button>
          <button className="btn ghost" onClick={() => { store.resetLesson(lesson.lessonId); setIdx(0); setSummary(false) }}>{challenge ? 'Retake the challenge' : 'Restart lesson'}</button>
          <Link className="btn ghost" to="/learn">All lessons</Link>
        </div>
      </div>
    )
  }

  const step = lesson.steps[idx]
  const status = done?.[step.id]
  const isLast = idx === lesson.steps.length - 1
  const advance = (recorded: boolean) => {
    if (!isLast) return setIdx(idx + 1)
    if (recorded) setSummary(true)
  }
  const onDone = (s: StepStatus) => store.recordStep(lesson.lessonId, step.id, s)
  const continueLabel = isLast ? (challenge ? 'Finish challenge' : 'Finish lesson') : 'Continue'

  return (
    <div className="page narrow">
      <p className="muted small">{kicker} · {lesson.durationMinutes} min · <Link to="/learn" className="link">All lessons</Link></p>
      <h1>{lesson.title}</h1>
      <p className="muted"><b>Goal:</b> {lesson.objective}</p>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={lesson.steps.length} aria-valuenow={idx + 1} aria-label="Progress">
        {lesson.steps.map((s, i) => <span key={s.id} className={`dot${i === idx ? ' current' : done?.[s.id] ? ' done' : ''}`} />)}
      </div>
      <section className="card">
        <p className="muted small">Step {idx + 1} of {lesson.steps.length}</p>
        <h2>{step.title}</h2>
        {idx === 0 && <p className="scenario">{lesson.scenario}</p>}
        <StepBody key={step.id} step={step} status={status} onDone={onDone} challenge={challenge} />
      </section>
      <div className="row between">
        <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Back</button>
        {step.kind === 'read' || step.kind === 'study' ? (
          <button className="btn primary" onClick={() => { if (!status) onDone('done'); advance(true) }}>{continueLabel}</button>
        ) : (
          <button className="btn primary" disabled={!status} onClick={() => advance(!!status)}>{continueLabel}</button>
        )}
      </div>
    </div>
  )
}

function ChallengeResult({ lessonId }: { lessonId: string }) {
  const { lessonProgress } = useAppState()
  const lesson = ALL_LESSONS.find((l) => l.lessonId === lessonId)!
  const r = challengeScore(lesson, lessonProgress[lessonId]?.steps)
  const pct = Math.round((100 * r.firstTry) / r.graded)
  const review = [...new Set(r.missed.map((m) => m.reviewLessonId).filter((x): x is string => !!x))]
  return (
    <section className="card">
      <h2>Your score</h2>
      <p className="big">{r.firstTry} of {r.graded} right on the first try ({pct}%)</p>
      {r.missed.length === 0 ? (
        <p className="ok">A clean sweep. You can apply DiD to new cases without prompting.</p>
      ) : (
        <>
          <p className="muted">You got these after retries or by revealing the answer. Revisit the matching lessons:</p>
          <ul className="notes">
            {review.map((id) => {
              const l = ALL_LESSONS.find((x) => x.lessonId === id)
              return l && <li key={id}><Link to={`/learn/${id}`} className="link">{l.title}</Link></li>
            })}
          </ul>
        </>
      )}
    </section>
  )
}
