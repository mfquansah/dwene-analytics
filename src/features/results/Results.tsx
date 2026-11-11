import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { estimateDiD, generateData, testParallelTrends } from '../../stats'
import { store, useAppState } from '../../storage/store'
import { TrendChart } from './Chart'
import { buildTrendSeries } from './series'

const f = (v: number, d = 2) => v.toFixed(d)
const fp = (p: number) => (p < 0.001 ? '< 0.001' : p.toFixed(3))

export function ResultsList() {
  const { experiments } = useAppState()
  return (
    <div className="page narrow">
      <h1>Results</h1>
      {experiments.length === 0 ? (
        <p className="muted">No experiments yet. <Link to="/lab" className="link">Design your first one.</Link></p>
      ) : (
        <ul className="list card">{experiments.map((e) => (
          <li key={e.id}>
            <Link to={`/results/${e.id}`} className="link">{e.name}</Link>
            <span className="muted">{new Date(e.createdAt).toLocaleDateString()}</span>
          </li>
        ))}</ul>
      )}
    </div>
  )
}

export function ResultsDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const exp = useAppState().experiments.find((e) => e.id === id)
  const [reveal, setReveal] = useState(false)

  const calc = useMemo(() => {
    if (!exp) return null
    const ds = generateData(exp.params)
    return { ds, did: estimateDiD(ds.data), pt: testParallelTrends(ds.data), series: buildTrendSeries(ds) }
  }, [exp])

  if (!exp || !calc) return <div className="page narrow"><h1>Experiment not found</h1><Link to="/results" className="link">Back to results</Link></div>
  const { ds, did, pt, series } = calc
  const { means, effect } = did
  const sig = effect.p < 0.05
  const covers = effect.ci95[0] <= ds.truth.trueEffect && ds.truth.trueEffect <= effect.ci95[1]

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1>{exp.name}</h1>
          {exp.hypothesis && <p className="muted">{exp.hypothesis}</p>}
          <p className="muted small">{ds.params.unitsPerGroup * 2} units · {ds.params.periods} periods · treatment from period {ds.params.treatmentStart} · seed {ds.params.seed}</p>
        </div>
        <button className="btn ghost" onClick={() => { store.deleteExperiment(exp.id); nav('/results') }}>Delete</button>
      </div>

      <div className="stats">
        <div className="card stat"><div className="muted small">DiD estimate</div><div className="big">{f(effect.estimate)}</div></div>
        <div className="card stat"><div className="muted small">95% confidence interval</div><div className="big">{f(effect.ci95[0])} to {f(effect.ci95[1])}</div></div>
        <div className="card stat"><div className="muted small">Standard error</div><div className="big">{f(effect.se)}</div></div>
        <div className="card stat"><div className="muted small">p-value</div><div className="big">{fp(effect.p)}</div></div>
      </div>

      <section className="card">
        <h2>Outcome over time</h2>
        <TrendChart series={series} treatmentStart={ds.params.treatmentStart} revealTruth={reveal} />
        <p className="muted small">The dashed line is what DiD assumes would have happened to the treated group without treatment: its pre-period level, moved by the comparison group's change. The gap between it and the treated line is the estimated effect.</p>
      </section>

      <div className="grid2">
        <section className="card">
          <h2>2 × 2 means</h2>
          <table className="table">
            <thead><tr><th></th><th>Pre</th><th>Post</th><th>Change</th></tr></thead>
            <tbody>
              <tr><th>Treated</th><td>{f(means.treatedPre)}</td><td>{f(means.treatedPost)}</td><td>{f(means.treatedPost - means.treatedPre)}</td></tr>
              <tr><th>Comparison</th><td>{f(means.comparisonPre)}</td><td>{f(means.comparisonPost)}</td><td>{f(means.comparisonPost - means.comparisonPre)}</td></tr>
              <tr className="total"><th>Difference in differences</th><td></td><td></td><td>{f(means.did)}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Parallel trends check</h2>
          {pt ? (
            <>
              <p className={pt.violated ? 'warn' : 'ok'}>
                {pt.violated ? 'Evidence against parallel trends.' : 'No evidence against parallel trends.'}
              </p>
              <p className="muted small">Before treatment, treated units' outcomes changed {f(pt.slopeDifference.estimate, 3)} per period faster than comparison units (p = {fp(pt.slopeDifference.p)}). {pt.violated ? 'The DiD estimate may be biased.' : 'This does not prove the assumption holds: it only means this test found no difference.'}</p>
            </>
          ) : <p className="muted">Needs at least 2 pre-treatment periods.</p>}
        </section>
      </div>

      <section className="card">
        <h2>Interpretation</h2>
        <p>
          Treated units changed by {f(effect.estimate)} more than comparison units after treatment began. {sig ? 'This is statistically significant at the 5% level.' : 'This is not statistically significant at the 5% level.'} The result holds only if the comparison group is a good stand-in for how treated units would have evolved without treatment.
        </p>
      </section>

      <section className="card">
        <div className="row between">
          <h2>Ground truth</h2>
          <button className="btn ghost" onClick={() => setReveal(!reveal)}>{reveal ? 'Hide' : 'Reveal the true effect'}</button>
        </div>
        {reveal ? (
          <p>
            True effect: <b>{f(ds.truth.trueEffect)}</b>. Your estimate: <b>{f(effect.estimate)}</b> (error {f(effect.estimate - ds.truth.trueEffect)}). The confidence interval {covers ? 'contains' : 'misses'} the truth.
            {ds.truth.expectedBias !== 0 && <> The injected trend difference adds an expected bias of <b>{f(ds.truth.expectedBias)}</b>.</>}
          </p>
        ) : <p className="muted">Form your own conclusion first, then reveal how close the estimate came.</p>}
      </section>
    </div>
  )
}
