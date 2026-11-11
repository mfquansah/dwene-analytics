import { ArrowRight, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MAX_PERIODS, MAX_UNITS_PER_GROUP, validateParams, type SimParams } from '../../stats'
import { store, useAppState } from '../../storage/store'
import type { Experiment } from '../../storage/types'
import { FIELD_BY_KEY, FIELDS, SECTIONS } from './fields'
import { PowerCheck } from './PowerCheck'
import { Walkthrough } from './Walkthrough'

const newExperiment = (id: string, name: string, hypothesis: string, params: SimParams): Experiment => ({
  id, name: name.trim() || 'Untitled experiment', hypothesis: hypothesis.trim(), params, createdAt: new Date().toISOString(),
})
const randomSeed = () => Math.floor(Math.random() * 1_000_000)
const METHODS = [
  { id: 'did', title: 'Difference-in-differences', sub: 'Before/after vs. comparison', on: true },
  { id: 'ab', title: 'A/B test', sub: 'Random assignment', on: false },
  { id: 'rd', title: 'Regression discontinuity', sub: 'Cutoff-based assignment', on: false },
]

export function Designer() {
  const nav = useNavigate()
  const [query] = useSearchParams()
  const { walkthroughSeen } = useAppState()
  const [replay, setReplay] = useState(false)
  const showTour = !walkthroughSeen || replay
  const closeTour = () => { setReplay(false); store.setWalkthroughSeen(true) }
  const [name, setName] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {
      unitsPerGroup: '20', periods: '12', treatmentStart: '6', effectSize: '2',
      noise: '1.5', baselineDifference: '3', trendDifference: '0', seed: String(randomSeed()),
    }
    // Presets (e.g. from a lesson) arrive as query params; ignore anything that is not a finite number.
    for (const f of FIELDS) {
      const q = query.get(f.key)
      if (q !== null && q.trim() !== '' && Number.isFinite(Number(q))) defaults[f.key] = q
    }
    return defaults
  })

  const params = Object.fromEntries(FIELDS.map((f) => [f.key, Number(vals[f.key])])) as unknown as SimParams
  const blank = Object.values(vals).some((v) => v.trim() === '')
  const errors = blank ? ['Fill in every field'] : validateParams(params)

  function run() {
    if (errors.length) return
    const id = crypto.randomUUID()
    store.addExperiment(newExperiment(id, name, hypothesis, params))
    nav(`/lab/run/${id}`)
  }

  return (
    <div className="page">
      <p className="crumbs">Lab / New experiment</p>
      <h1>Design your experiment</h1>
      <p className="muted">Set up your hypothesis, method and simulation parameters. <button className="linkbtn" onClick={() => setReplay(true)}>Replay the walkthrough</button></p>

      <div className="designer">
        <div>
          <section className="card step-card">
            <h2><span className="num">1</span>What are you studying?</h2>
            <div className="grid2 tight">
              <label className="field"><span>Experiment name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Regional price change" /></label>
              <label className="field"><span>Hypothesis</span><input value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="e.g. The new pricing raised revenue in treated regions" /></label>
            </div>
          </section>

          <section className="card step-card">
            <h2><span className="num">2</span>Method and data</h2>
            <p className="field-label">Causal method</p>
            <div className="method-cards" role="radiogroup" aria-label="Causal method">
              {METHODS.map((m) => (
                <div key={m.id} role="radio" aria-checked={m.on} aria-disabled={!m.on} className={`method-card${m.on ? ' on' : ''}`}>
                  <span className="radio-dot" aria-hidden="true" />
                  <span><b>{m.title}</b><br /><span className="muted small">{m.on ? m.sub : 'Coming later'}</span></span>
                </div>
              ))}
            </div>
            <p className="field-label">Data source</p>
            <div className="row center wrap">
              <div className="segmented" role="radiogroup" aria-label="Data source">
                <span role="radio" aria-checked="true" className="seg on">Simulate data</span>
                <span role="radio" aria-checked="false" aria-disabled="true" className="seg off" title="Coming in version 2">Upload real data</span>
              </div>
              <span className="muted small">Simulations know the true effect, so you can check how close your estimate gets. Uploading real data comes later.</span>
            </div>
          </section>

          {SECTIONS.map((s, i) => (
            <section className="card step-card" key={s.title}>
              <div className="row between center">
                <h2><span className="num">{i + 3}</span>{s.title}{s.chip && <span className="muted small"> (simulation only)</span>}</h2>
                {s.chip && <span className="chip"><EyeOff size={15} aria-hidden="true" />{s.chip}</span>}
              </div>
              {s.note && <p className="muted small">{s.note}</p>}
              <div className="grid2 tight fields">
                {s.keys.map((k) => {
                  const f = FIELD_BY_KEY[k]
                  return (
                    <label className="field" key={k} data-tour={k}>
                      <span>{f.label}</span>
                      <input type="number" step={f.step ?? 1} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} aria-describedby={`h-${k}`} />
                      <small className="muted" id={`h-${k}`}>{f.help}{k === 'unitsPerGroup' ? ` Up to ${MAX_UNITS_PER_GROUP}.` : k === 'periods' ? ` Up to ${MAX_PERIODS}.` : ''}</small>
                    </label>
                  )
                })}
              </div>
              {s.keys.includes('seed') && <button className="btn ghost sm" onClick={() => setVals({ ...vals, seed: String(randomSeed()) })}>New random seed</button>}
            </section>
          ))}

          {errors.length > 0 && <ul className="errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="row between center form-actions">
            <Link to="/" className="btn ghost">Back</Link>
            <button className="btn primary" data-tour="run" disabled={errors.length > 0} onClick={run}>Launch simulation<ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        </div>
        <PowerCheck params={params} />
      </div>
      {showTour && <Walkthrough onClose={closeTour} />}
    </div>
  )
}
