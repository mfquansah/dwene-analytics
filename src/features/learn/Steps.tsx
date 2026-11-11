import { useMemo, useState } from 'react'
import { estimateDiD, generateData, testParallelTrends, type SimParams } from '../../stats'
import type { StepStatus } from '../../storage/types'
import { TrendChart } from '../results/Chart'
import { buildTrendSeries } from '../results/series'
import { ExploreChart } from './ExploreChart'
import { canReveal, gradeChoice, gradeNumeric, hintFor, parseNumber, requirementMet, simulationComplete } from './grading'
import type { ChoiceStep, ExploreStep, NumericStep, ReadStep, SimulationStep, TableSpec, ChartSpec } from './types'

interface StepProps<T> {
  step: T
  status: StepStatus | undefined
  onDone: (s: StepStatus) => void
}

function Table({ table }: { table: TableSpec }) {
  return (
    <table className="table lesson-table">
      <thead><tr>{table.columns.map((c, i) => <th key={c} scope="col" className={i === 0 ? 'left' : ''}>{c}</th>)}</tr></thead>
      <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
    </table>
  )
}

function Visuals({ table, chart }: { table?: TableSpec; chart?: ChartSpec }) {
  const all = useMemo(() => new Set(chart?.series.map((s) => s.id)), [chart])
  return (
    <>
      {table && <Table table={table} />}
      {chart && <ExploreChart chart={chart} visible={all} />}
    </>
  )
}

export function ReadView({ step }: StepProps<ReadStep>) {
  return (
    <>
      {step.body.map((p, i) => <p key={i} className="lesson-p">{p}</p>)}
      <Visuals table={step.table} chart={step.chart} />
    </>
  )
}

function Feedback({ status, explanation, hint, wrong }: { status?: StepStatus; explanation: string; hint: string | null; wrong: boolean }) {
  return (
    <div aria-live="polite">
      {status === 'correct' && <p className="ok">Correct.</p>}
      {status === 'revealed' && <p className="warn">Here is the answer.</p>}
      {!status && wrong && <p className="warn">Not quite.</p>}
      {!status && hint && <p className="hint">Hint: {hint}</p>}
      {status && <p className="explain">{explanation}</p>}
    </div>
  )
}

export function ChoiceView({ step, status, onDone }: StepProps<ChoiceStep>) {
  const [sel, setSel] = useState<string | null>(status ? step.correct : null)
  const [wrong, setWrong] = useState(0)
  const check = () => {
    if (!sel) return
    if (gradeChoice(step, sel)) onDone('correct')
    else setWrong(wrong + 1)
  }
  return (
    <>
      <Visuals table={step.table} chart={step.chart} />
      <fieldset className="choices" disabled={!!status}>
        <legend className="lesson-q">{step.prompt}</legend>
        {step.options.map((o) => (
          <label key={o.id} className={`choice${sel === o.id ? ' selected' : ''}`}>
            <input type="radio" name={step.id} checked={sel === o.id} onChange={() => setSel(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>
      {!status && (
        <div className="row">
          <button className="btn primary" disabled={!sel} onClick={check}>Check answer</button>
          {canReveal(step.hints, wrong) && <button className="btn ghost" onClick={() => onDone('revealed')}>Show the answer</button>}
        </div>
      )}
      <Feedback status={status} explanation={step.explanation} hint={hintFor(step.hints, wrong)} wrong={wrong > 0} />
    </>
  )
}

export function NumericView({ step, status, onDone }: StepProps<NumericStep>) {
  const [raw, setRaw] = useState(status ? String(step.correct) : '')
  const [wrong, setWrong] = useState(0)
  const [invalid, setInvalid] = useState(false)
  const check = () => {
    const v = parseNumber(raw)
    setInvalid(v === null)
    if (v === null) return
    if (gradeNumeric(step, v)) onDone('correct')
    else setWrong(wrong + 1)
  }
  return (
    <>
      <Visuals table={step.table} chart={step.chart} />
      <label className="field">
        <span className="lesson-q">{step.prompt}</span>
        <div className="row">
          <input inputMode="decimal" value={raw} disabled={!!status} onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !status && check()} aria-invalid={invalid} placeholder="Your answer" />
          {step.unit && <span className="muted">{step.unit}</span>}
        </div>
      </label>
      {invalid && <p className="warn">Enter a number, like 10 or +10.</p>}
      {!status && (
        <div className="row">
          <button className="btn primary" disabled={raw.trim() === ''} onClick={check}>Check answer</button>
          {canReveal(step.hints, wrong) && <button className="btn ghost" onClick={() => onDone('revealed')}>Show the answer</button>}
        </div>
      )}
      <Feedback status={status} explanation={step.explanation} hint={hintFor(step.hints, wrong)} wrong={wrong > 0} />
    </>
  )
}

export function ExploreView({ step, status, onDone }: StepProps<ExploreStep>) {
  const [n, setN] = useState(status ? step.layers.length : 0)
  const visible = new Set(step.layers.slice(0, n).flatMap((l) => l.seriesIds))
  const next = step.layers[n]
  const reveal = () => {
    setN(n + 1)
    if (n + 1 === step.layers.length) onDone('done')
  }
  return (
    <>
      <p className="lesson-q">{step.prompt}</p>
      <ExploreChart chart={step.chart} visible={visible} />
      <ul className="notes" aria-live="polite">{step.layers.slice(0, n).map((l) => <li key={l.id}>{l.note}</li>)}</ul>
      {next && <button className="btn primary" onClick={reveal}>{next.label}</button>}
    </>
  )
}

export function SimulationView({ step, status, onDone }: StepProps<SimulationStep>) {
  const initial = Object.fromEntries(step.adjustable.map((a) => [a.key, step.params[a.key]]))
  const [vals, setVals] = useState<Record<string, number>>(initial)
  const [seen, setSeen] = useState<Array<Record<string, number>>>([initial])
  const params: SimParams = { ...step.params, ...vals }
  const calc = useMemo(() => {
    const ds = generateData(params)
    return { ds, did: estimateDiD(ds.data), pt: testParallelTrends(ds.data), series: buildTrendSeries(ds) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])
  const { ds, did, pt, series } = calc

  const change = (key: string, v: number) => {
    const next = { ...vals, [key]: v }
    const nextSeen = [...seen, next]
    setVals(next)
    setSeen(nextSeen)
    if (!status && simulationComplete(step, nextSeen)) onDone('done')
  }
  const err = did.effect.estimate - ds.truth.trueEffect

  return (
    <>
      <p className="lesson-q">{step.prompt}</p>
      {step.adjustable.map((a) => (
        <label className="field" key={a.key}>
          <span>{a.label}: <b>{vals[a.key].toFixed(1)}</b></span>
          <input type="range" min={a.min} max={a.max} step={a.step} value={vals[a.key]} onChange={(e) => change(a.key, Number(e.target.value))} />
          <small className="muted">{a.help}</small>
        </label>
      ))}
      <TrendChart series={series} treatmentStart={ds.params.treatmentStart} revealTruth />
      <div className="stats">
        <div className="card stat"><div className="muted small">True effect (known here)</div><div className="big">{ds.truth.trueEffect.toFixed(2)}</div></div>
        <div className="card stat"><div className="muted small">DiD estimate</div><div className="big">{did.effect.estimate.toFixed(2)}</div></div>
        <div className="card stat"><div className="muted small">Estimate minus truth</div><div className="big">{err >= 0 ? '+' : ''}{err.toFixed(2)}</div></div>
        <div className="card stat"><div className="muted small">Pre-trend check</div><div className="big small-big">{pt ? (pt.violated ? 'Flags a difference' : 'No difference found') : 'n/a'}</div></div>
      </div>
      <ul className="checklist">
        {step.requires.map((r) => {
          const ok = requirementMet(r, seen)
          return <li key={r.label} className={ok ? 'ok' : 'muted'}>{ok ? '✓' : '○'} {r.label}</li>
        })}
      </ul>
      {status && <p className="explain">{step.explanation}</p>}
    </>
  )
}
