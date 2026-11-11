import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MiniTrend } from '../../components/MiniTrend'
import { estimateDiD, generateData, testParallelTrends } from '../../stats'
import { store, useAppState } from '../../storage/store'
import { TrendChart } from './Chart'
import { EffectPlot } from './EffectPlot'
import { Repeated } from './Repeated'
import { buildTrendSeries } from './series'

const f = (v: number, d = 2) => v.toFixed(d)
const fp = (p: number) => (p < 0.001 ? '< 0.001' : p.toFixed(3))
/** 'p < 0.001' or 'p = 0.034'. */
const pEq = (p: number) => (p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`)
const oftenText = (p: number) => (p < 0.001 ? 'in fewer than 1 in 1,000 samples' : `about ${(p * 100).toFixed(p < 0.01 ? 1 : 0)}% of the time`)
const signed = (v: number, d = 2) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`

export function ResultsList() {
  const { experiments } = useAppState()
  return (
    <div className="page narrow">
      <h1>Results</h1>
      <p className="muted">Every experiment you have run in this browser.</p>
      {experiments.length === 0 ? (
        <p className="muted">No experiments yet. <Link to="/lab" className="link">Design your first one.</Link></p>
      ) : (
        <ul className="list card">{experiments.map((e) => (
          <li key={e.id}>
            <Link to={`/results/${e.id}`} className="exp-row">
              <span className="exp-tile" aria-hidden="true" />
              <span>
                <span className="exp-name">{e.name} <span className="pill indigo">Diff-in-diff · Simulation</span></span>
                <span className="muted small exp-meta">{e.params.unitsPerGroup * 2} units · {e.params.periods} periods · {new Date(e.createdAt).toLocaleDateString()}</span>
              </span>
            </Link>
            <span className="pill green">Completed</span>
          </li>
        ))}</ul>
      )}
    </div>
  )
}

type Tab = 'overview' | 'repeated'

export function ResultsDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const exp = useAppState().experiments.find((e) => e.id === id)
  const [reveal, setReveal] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [autoRun, setAutoRun] = useState(false)

  const calc = useMemo(() => {
    if (!exp) return null
    const ds = generateData(exp.params)
    return { ds, did: estimateDiD(ds.data), pt: testParallelTrends(ds.data), series: buildTrendSeries(ds) }
  }, [exp])

  if (!exp || !calc) return <div className="page narrow"><h1>Experiment not found</h1><Link to="/results" className="link">Back to results</Link></div>
  const { ds, did, pt, series } = calc
  const { means, effect } = did
  const sig = effect.p < 0.05
  const truth = ds.truth.trueEffect
  const covers = effect.ci95[0] <= truth && truth <= effect.ci95[1]
  const wide = effect.ci95[1] - effect.ci95[0] > Math.abs(effect.estimate)
  const baseline = means.treatedPre
  const relPct = baseline !== 0 ? (100 * effect.estimate) / Math.abs(baseline) : null

  return (
    <div className="page">
      <div className="row between wrap">
        <div>
          <div className="row center"><h1>{exp.name}</h1><span className="pill green">Completed</span></div>
          <p className="muted">{ds.params.unitsPerGroup * 2} units · {ds.params.periods} periods · treatment from period {ds.params.treatmentStart} · seed {ds.params.seed} · Difference-in-differences</p>
          {exp.hypothesis && <p className="muted small">Hypothesis: {exp.hypothesis}</p>}
        </div>
        <button className="btn ghost sm" onClick={() => { store.deleteExperiment(exp.id); nav('/results') }}><Trash2 size={15} aria-hidden="true" />Delete</button>
      </div>

      <div className="tabs" role="tablist" aria-label="Results sections">
        {([['overview', 'Overview'], ['repeated', 'Repeated simulations']] as const).map(([k, label]) => (
          <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className="tab" onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
          <div className="stats five">
            <div className="card stat"><div className="label">Treated change</div><div className="big">{signed(means.treatedPost - means.treatedPre)}</div><div className="sub">{f(means.treatedPre)} → {f(means.treatedPost)}</div></div>
            <div className="card stat"><div className="label">Comparison change</div><div className="big">{signed(means.comparisonPost - means.comparisonPre)}</div><div className="sub">{f(means.comparisonPre)} → {f(means.comparisonPost)}</div></div>
            <div className="card stat"><div className="label">DiD estimate</div><div className={`big ${effect.estimate > 0 ? 'green' : ''}`}>{signed(effect.estimate)}</div><div className="sub">Standard error {f(effect.se)}</div></div>
            <div className="card stat"><div className="label">95% confidence interval</div><div className="big small-big">{f(effect.ci95[0])} to {f(effect.ci95[1])}</div></div>
            <div className="card stat"><div className="label">p-value</div><div className="big">{fp(effect.p)}</div><span className={`pill ${sig ? 'green' : 'amber'}`}>{sig ? 'Significant at α = 0.05' : 'Not significant at α = 0.05'}</span></div>
          </div>

          <section className="callout truth-banner">
            <div>
              <div className="eyebrow accent">Ground truth {reveal ? 'revealed' : 'hidden'}</div>
              <p className="truth-line">{reveal ? (covers && Math.abs(effect.estimate - truth) <= effect.se * 1.5 ? 'Your estimate landed close to the true effect.' : covers ? 'The interval contains the truth, but the estimate was off.' : 'The interval missed the true effect.') : 'Form your own conclusion first, then check how close the estimate came.'}</p>
            </div>
            {reveal ? (
              <div className="truth-stats">
                <div><span className="muted small">True effect</span><b>{signed(truth)}</b></div>
                <div><span className="muted small">Your estimate</span><b>{signed(effect.estimate)}</b></div>
                <div><span className="muted small">CI covers truth</span><b className={covers ? 'ok' : 'warn'}>{covers ? 'Yes' : 'No'}</b></div>
              </div>
            ) : <button className="btn primary" onClick={() => setReveal(true)}>Reveal the true effect</button>}
          </section>
          {reveal && ds.truth.expectedBias !== 0 && <p className="muted small">The injected trend difference adds an expected bias of {signed(ds.truth.expectedBias)} to the estimate.</p>}

          <div className="result-grid">
            <section className="card">
              <h2>Outcome over time</h2>
              <TrendChart series={series} treatmentStart={ds.params.treatmentStart} revealTruth={reveal} />
              <p className="muted small">The dashed line is what DiD assumes would have happened to treated units without treatment: their pre-period level, moved by the comparison group's change. The gap to the treated line is the estimated effect.</p>
            </section>
            <section className="card">
              <h2>Effect size · estimate with 95% CI</h2>
              <EffectPlot estimate={effect.estimate} ci={effect.ci95} truth={reveal ? truth : undefined} />
              <p className="muted small">The shaded band is the 95% confidence interval. If it excludes the "No effect" line, the result is significant at 5%.</p>
            </section>
          </div>

          <div className="trio">
            <section className="card">
              <h2>Statistical interpretation</h2>
              <p>The result is {sig ? '' : 'not '}statistically significant at the 5% level ({pEq(effect.p)}). If there were truly no effect and the model's assumptions held, a difference at least this large would appear {oftenText(effect.p)}.</p>
              <p className="muted small">The 95% interval runs from {f(effect.ci95[0])} to {f(effect.ci95[1])}{wide ? ': wide, so the data are consistent with a broad range of effect sizes.' : '.'}</p>
            </section>
            <section className="card">
              <h2>Practical significance</h2>
              <p>{relPct !== null ? `An effect of ${signed(effect.estimate)} is about ${f(Math.abs(relPct), 1)}% ${relPct >= 0 ? 'above' : 'below'} the treated group's pre-period average of ${f(baseline)}.` : `The estimated effect is ${signed(effect.estimate)}.`} Whether that matters depends on what it costs and what the low end of the interval ({f(effect.ci95[0])}) would mean.</p>
              <p className="muted small">Significance is not importance: ask both questions.</p>
            </section>
            <section className="card">
              <h2>Try it many times</h2>
              <p>Re-run this exact design with new random data to see how often you would have caught the effect.</p>
              <button className="btn primary" onClick={() => { setAutoRun(true); setTab('repeated') }}>Run repeated simulations</button>
            </section>
          </div>

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
                  <p className={pt.violated ? 'warn' : 'ok'}>{pt.violated ? 'Evidence against parallel trends.' : 'No evidence against parallel trends.'}</p>
                  <p className="muted small">Before treatment, treated units' outcomes changed {f(pt.slopeDifference.estimate, 3)} per period faster than comparison units ({pEq(pt.slopeDifference.p)}). {pt.violated ? 'The DiD estimate may be biased.' : 'This does not prove the assumption holds: it only means this test found no difference.'}</p>
                </>
              ) : <p className="muted">Needs at least 2 pre-treatment periods.</p>}
              <div className="mini"><MiniTrend series={series.slice(0, ds.params.treatmentStart)} height={70} /></div>
            </section>
          </div>
        </div>
      )}

      {tab === 'repeated' && (
        <div role="tabpanel" id="panel-repeated" aria-labelledby="tab-repeated">
          <Repeated params={exp.params} estimate={effect.estimate} autoRun={autoRun} />
        </div>
      )}
    </div>
  )
}
