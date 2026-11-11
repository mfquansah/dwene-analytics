import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateParams, type SimParams } from '../../stats'
import { store, useAppState } from '../../storage/store'
import { FIELDS } from './fields'
import { Walkthrough } from './Walkthrough'

const randomSeed = () => Math.floor(Math.random() * 1_000_000)

export function Designer() {
  const nav = useNavigate()
  const { walkthroughSeen } = useAppState()
  const [replay, setReplay] = useState(false)
  const showTour = !walkthroughSeen || replay
  const closeTour = () => { setReplay(false); store.setWalkthroughSeen(true) }
  const [name, setName] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [vals, setVals] = useState<Record<string, string>>({
    unitsPerGroup: '20', periods: '12', treatmentStart: '6', effectSize: '2',
    noise: '1.5', baselineDifference: '3', trendDifference: '0', seed: String(randomSeed()),
  })

  const params: SimParams = {
    unitsPerGroup: Number(vals.unitsPerGroup), periods: Number(vals.periods),
    treatmentStart: Number(vals.treatmentStart), effectSize: Number(vals.effectSize),
    noise: Number(vals.noise), baselineDifference: Number(vals.baselineDifference),
    trendDifference: Number(vals.trendDifference), seed: Number(vals.seed),
  }
  const errors = [...validateParams(params), ...(Object.values(vals).some((v) => v.trim() === '') ? ['Fill in every field'] : [])]

  function run() {
    if (errors.length) return
    const id = crypto.randomUUID()
    store.addExperiment({
      id, name: name.trim() || 'Untitled experiment', hypothesis: hypothesis.trim(), params,
      createdAt: new Date().toISOString(),
    })
    nav(`/results/${id}`)
  }

  return (
    <div className="page narrow">
      <h1>Design your experiment</h1>
      <p className="muted">Set up a difference-in-differences study with data where you know the true answer. <button className="linkbtn" onClick={() => setReplay(true)}>Replay the walkthrough</button></p>

      <section className="card">
        <h2>1. What are you studying?</h2>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Regional price change" />
        </label>
        <label className="field">
          <span>Hypothesis</span>
          <input value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="e.g. The new pricing raised revenue in treated regions" />
        </label>
      </section>

      <section className="card">
        <h2>2. Data-generating assumptions</h2>
        <div className="grid2">
          {FIELDS.map((f) => (
            <label className="field" key={f.key} data-tour={f.key}>
              <span>{f.label}</span>
              <input type="number" step={f.step ?? 1} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
              <small className="muted">{f.help}</small>
            </label>
          ))}
        </div>
        <button className="btn ghost" onClick={() => setVals({ ...vals, seed: String(randomSeed()) })}>New random seed</button>
      </section>

      {errors.length > 0 && <ul className="errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <button className="btn primary" data-tour="run" disabled={errors.length > 0} onClick={run}>Run experiment</button>
      {showTour && <Walkthrough onClose={closeTour} />}
    </div>
  )
}
