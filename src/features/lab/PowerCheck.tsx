import { useDeferredValue, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { estimatePower, validateParams, type SimParams } from '../../stats'

const TARGET = 0.8

function verdict(power: number, effect: number) {
  if (effect === 0) return { tone: 'neutral', text: 'With no true effect, a "significant" result is a false alarm. Expect about 1 in 20 runs to produce one. Try it to see.' }
  if (power >= TARGET) return { tone: 'good', text: 'Well powered. A real effect of this size will usually be caught.' }
  if (power >= 0.5) return { tone: 'warn', text: 'Slightly underpowered. Try it anyway to see how often a real effect is missed.' }
  return { tone: 'warn', text: 'Underpowered. A real effect of this size will often be missed. More units, fewer noisy outcomes or a bigger effect help.' }
}

/** Right-hand panel: simulated chance of detecting the effect the learner is about to generate. */
export function PowerCheck({ params }: { params: SimParams }) {
  const deferred = useDeferredValue(params)
  const stale = deferred !== params
  const result = useMemo(() => (validateParams(deferred).length === 0 ? estimatePower(deferred) : null), [deferred])
  const pct = result ? Math.round(result.power * 100) : null
  const v = result ? verdict(result.power, deferred.effectSize) : null
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 })

  return (
    <aside className="side-stack" aria-label="Power check">
      <section className="card power" aria-busy={stale}>
        <h2>Power check</h2>
        {result && v ? (
          <>
            <p className="muted small">Chance of detecting a true effect of {fmt(deferred.effectSize)}</p>
            <div className="power-number" aria-live="polite">{pct}%</div>
            <div className="power-bar" role="img" aria-label={`${pct}% power; target 80%`}>
              <span className={v.tone === 'good' ? 'good' : ''} style={{ width: `${pct}%` }} />
              <i style={{ left: `${TARGET * 100}%` }} />
            </div>
            <p className="muted small">Target: 80% power</p>
            <dl className="power-rows">
              <div><dt>Units per group</dt><dd>{deferred.unitsPerGroup}</dd></div>
              <div><dt>Smallest effect detectable</dt><dd>±{fmt(result.minDetectableEffect)}</dd></div>
              <div><dt>Units per group for 80%</dt><dd>{result.unitsPerGroupFor80 === null ? 'n/a' : fmt(result.unitsPerGroupFor80)}</dd></div>
            </dl>
            <div className={`callout ${v.tone === 'warn' ? 'warning' : ''}`}><p>{v.text}</p></div>
            <p className="muted small">Estimated from {result.reps} simulated runs of this design.</p>
          </>
        ) : <p className="muted">Fix the highlighted fields to see the power check.</p>}
      </section>
      <section className="callout why">
        <h3>Why this matters</h3>
        <p>Power is the probability of detecting an effect that is really there. Small studies miss real effects, and the ones they do catch tend to overstate them.</p>
        <Link to="/learn/did-5" className="link">Lesson 5 · Interpret and communicate results</Link>
      </section>
    </aside>
  )
}
