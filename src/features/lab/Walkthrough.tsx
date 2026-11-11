import { useEffect, useState } from 'react'
import { TOUR_STEPS } from './walkthrough'

export function Walkthrough({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const step = TOUR_STEPS[i]
  const last = i === TOUR_STEPS.length - 1

  // Highlight this step's targets and bring the first one into view.
  useEffect(() => {
    const els = step.targets.flatMap((t) => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${t}"]`)))
    els.forEach((el) => el.classList.add('tour-spot'))
    els[0]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    return () => els.forEach((el) => el.classList.remove('tour-spot'))
  }, [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside className="tour" role="dialog" aria-label="Guided walkthrough" aria-live="polite">
      <div className="muted small">Step {i + 1} of {TOUR_STEPS.length}</div>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      <div className="row between">
        <button className="btn ghost" onClick={onClose}>Skip</button>
        <div className="row">
          {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>Back</button>}
          <button className="btn primary" autoFocus onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? 'Start designing' : 'Next'}
          </button>
        </div>
      </div>
    </aside>
  )
}
