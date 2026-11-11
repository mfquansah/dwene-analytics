import { Pause, Play, RotateCcw, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { generateData } from '../../stats'
import { useAppState } from '../../storage/store'
import { buildTrendSeries } from '../results/series'
import { interimAt, interimResults, msPerPeriod, peeksBelow, SPEEDS } from './playback'

const fp = (p: number) => (p < 0.001 ? '< 0.001' : p.toFixed(3))

export function Playground() {
  const { id } = useParams()
  const nav = useNavigate()
  const exp = useAppState().experiments.find((e) => e.id === id)
  const [current, setCurrent] = useState(0) // latest observed period (0-indexed)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(4)

  const calc = useMemo(() => {
    if (!exp) return null
    const ds = generateData(exp.params)
    return { ds, series: buildTrendSeries(ds), interim: interimResults(ds.data, exp.params.treatmentStart, exp.params.periods) }
  }, [exp])
  const last = (exp?.params.periods ?? 1) - 1
  const done = current >= last

  useEffect(() => {
    if (!playing || done) return
    const t = setTimeout(() => setCurrent((c) => Math.min(c + 1, last)), msPerPeriod(speed))
    return () => clearTimeout(t)
  }, [playing, done, current, speed, last])

  if (!exp || !calc) return <div className="page narrow"><h1>Experiment not found</h1><Link to="/lab" className="link">Design a new one</Link></div>
  const { ds, series, interim } = calc
  const { treatmentStart, periods } = ds.params
  const now = interimAt(interim, current)
  const peeks = peeksBelow(interim, current)
  const view = series.map((s) => (s.period <= current ? s : { period: s.period } as typeof s))
  const row = series[current]

  return (
    <div className="page">
      <div className="row between wrap">
        <div>
          <div className="row center"><h1>{exp.name}</h1><span className={`pill ${done ? 'indigo' : playing ? 'green' : 'amber'}`}>{done ? 'Complete' : playing ? '● Running' : 'Paused'}</span></div>
          <p className="muted">Period {current + 1} of {periods} · {ds.params.unitsPerGroup * 2} units · treatment starts at period {treatmentStart} · DiD simulation</p>
        </div>
        <div className="row center controls">
          <div className="segmented" role="radiogroup" aria-label="Playback speed">
            {SPEEDS.map((s) => <button key={s} role="radio" aria-checked={speed === s} className={`seg btn-seg${speed === s ? ' on' : ''}`} onClick={() => setSpeed(s)}>{s}×</button>)}
          </div>
          <button className="btn ghost" onClick={() => setPlaying(!playing)} disabled={done}>{playing && !done ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{playing && !done ? 'Pause' : 'Play'}</button>
          <button className="btn ghost" onClick={() => { setCurrent(0); setPlaying(true) }}><RotateCcw size={15} aria-hidden="true" />Reset</button>
        </div>
      </div>

      <div className="stats">
        <div className="card stat"><div className="label"><span className="swatch" style={{ background: 'var(--color-comparison)' }} />Comparison mean</div><div className="big">{row.comparison.toFixed(2)}</div><div className="sub">Period {current}</div></div>
        <div className="card stat"><div className="label"><span className="swatch" style={{ background: 'var(--color-treated)' }} />Treated mean</div><div className="big">{row.treated.toFixed(2)}</div><div className="sub">Period {current}</div></div>
        <div className="card stat"><div className="label">DiD estimate so far</div><div className={`big ${now && now.estimate > 0 ? 'green' : ''}`}>{now ? `${now.estimate >= 0 ? '+' : ''}${now.estimate.toFixed(2)}` : '—'}</div><div className="sub">{now ? 'Using periods observed so far' : `Treatment starts at period ${treatmentStart}`}</div></div>
        <div className="card stat"><div className="label">p-value {done ? '' : '(interim)'}</div><div className="big">{now ? fp(now.p) : '—'}</div>{now && <span className={`pill ${done ? 'green' : 'amber'}`}>{done ? 'Final' : 'Interim look, not final'}</span>}</div>
      </div>

      <div className="play-grid">
        <section className="card">
          <h2>Average outcome by period</h2>
          <div className="chart" role="img" aria-label={`Average outcome for treated and comparison groups, observed through period ${current}`}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={view} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="period" type="number" domain={[0, periods - 1]} ticks={series.map((s) => s.period)} />
                <YAxis domain={['auto', 'auto']} tickFormatter={(v: number) => v.toFixed(0)} width={40} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : String(v))} labelFormatter={(l) => `Period ${l}`} />
                {!done && <ReferenceArea x1={current} x2={periods - 1} fill="var(--color-bg)" fillOpacity={0.9} label={{ value: 'Not yet observed', fontSize: 12, fill: 'var(--color-text-muted)' }} />}
                <ReferenceLine x={treatmentStart - 0.5} stroke="var(--color-text-muted)" strokeDasharray="4 4" label={{ value: 'Treatment starts', position: 'insideTopLeft', fontSize: 11 }} />
                {!done && <ReferenceLine x={current} stroke="var(--color-text)" strokeDasharray="3 3" />}
                <Line name="Treated" dataKey="treated" stroke="var(--color-treated)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                <Line name="Comparison" dataKey="comparison" stroke="var(--color-comparison)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                <Line name="Estimated counterfactual" dataKey="estimatedCounterfactual" stroke="var(--color-treated)" strokeDasharray="6 4" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <aside className="side-stack">
          <section className="callout warning" aria-live="polite">
            <h3><TriangleAlert size={17} aria-hidden="true" />Careful with peeking</h3>
            {done ? <p>All {periods} periods are observed, so this is the final look. Stopping earlier because the result looked good would have inflated the chance of a false positive.</p>
              : peeks > 0 ? <p>The p-value has been below 0.05 at {peeks} look{peeks > 1 ? 's' : ''} already. Stopping the first time it looks good inflates false positives. Decide at period {periods}.</p>
              : <p>Every look at interim results is another chance for a false alarm. Decide once all {periods} periods are in.</p>}
          </section>
          <section className="card">
            <h2>Ground truth</h2>
            <div className="truth-box"><span>True effect</span><span className="muted" aria-label="hidden">• • •</span></div>
            <p className="muted small">Revealed when the simulation ends, so you can compare your estimate against the truth.</p>
            <button className="btn primary block" onClick={() => nav(`/results/${exp.id}`)}>{done ? 'See full analysis' : 'Skip to end & analyze'}</button>
          </section>
        </aside>
      </div>

      <section className="card">
        <h2>Period by period</h2>
        <div className="scroll">
          <table className="table">
            <thead><tr><th>Period</th><th>Treated</th><th>Comparison</th><th>DiD estimate</th><th>p-value</th></tr></thead>
            <tbody>
              {series.slice(0, current + 1).reverse().map((s) => {
                const r = interimAt(interim, s.period)
                return <tr key={s.period}><th>{s.period}{s.period >= treatmentStart ? ' (post)' : ''}</th><td>{s.treated.toFixed(2)}</td><td>{s.comparison.toFixed(2)}</td><td>{r ? r.estimate.toFixed(2) : '—'}</td><td>{r ? fp(r.p) : '—'}</td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
