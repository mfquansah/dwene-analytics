import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateParams, type SimParams } from '../../stats'
import { store } from '../../storage/store'

interface Field {
  key: Exclude<keyof SimParams, 'commonTrend' | 'baselineLevel' | 'unitEffectSd'>
  label: string
  help: string
  step?: number
}

const FIELDS: Field[] = [
  { key: 'unitsPerGroup', label: 'Units per group', help: 'Regions, stores or people in each of the treated and comparison groups.' },
  { key: 'periods', label: 'Total periods', help: 'Pre plus post periods (e.g. weeks).' },
  { key: 'treatmentStart', label: 'Treatment starts at period', help: 'First treated period (0-indexed). Earlier periods are "pre".' },
  { key: 'effectSize', label: 'True effect', help: 'The real effect on treated units. The analysis tries to recover it.', step: 0.1 },
  { key: 'noise', label: 'Noise (SD)', help: 'Random variation in each observation. More noise means wider confidence intervals.', step: 0.1 },
  { key: 'baselineDifference', label: 'Baseline difference', help: 'How much higher treated units start. A constant gap does not bias DiD.', step: 0.1 },
  { key: 'trendDifference', label: 'Trend difference', help: 'Extra growth per period for treated units. Anything but 0 breaks parallel trends and biases the estimate.', step: 0.05 },
  { key: 'seed', label: 'Seed', help: 'Same seed, same data. Change it to draw a new sample.' },
]

const randomSeed = () => Math.floor(Math.random() * 1_000_000)

export function Designer() {
  const nav = useNavigate()
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
      <p className="muted">Set up a difference-in-differences study with data where you know the true answer.</p>

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
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input type="number" step={f.step ?? 1} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
              <small className="muted">{f.help}</small>
            </label>
          ))}
        </div>
        <button className="btn ghost" onClick={() => setVals({ ...vals, seed: String(randomSeed()) })}>New random seed</button>
      </section>

      {errors.length > 0 && <ul className="errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <button className="btn primary" disabled={errors.length > 0} onClick={run}>Run experiment</button>
    </div>
  )
}
