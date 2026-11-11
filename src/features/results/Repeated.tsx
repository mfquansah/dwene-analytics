import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { histogram, repeatStudy, type SimParams } from '../../stats'

const pct = (x: number) => `${Math.round(x * 100)}%`

/** "Try it 1,000 times": re-run the same design with fresh random draws and show how estimates vary. */
export function Repeated({ params, estimate, autoRun }: { params: SimParams; estimate: number; autoRun: boolean }) {
  const [started, setStarted] = useState(autoRun)
  const result = useMemo(() => (started ? repeatStudy(params) : null), [started, params])
  const bins = useMemo(() => (result ? histogram(result.estimates, 24) : []), [result])
  const truth = params.effectSize

  if (!result) {
    return (
      <section className="card">
        <h2>Try it many times</h2>
        <p className="muted">Re-run this exact design with new random data to see how often you would have caught the effect, and how much a single estimate can wander.</p>
        <button className="btn primary" onClick={() => setStarted(true)}>Run repeated simulations</button>
      </section>
    )
  }
  const bias = result.mean - truth
  return (
    <>
      <div className="stats">
        <div className="card stat"><div className="label">Runs</div><div className="big">{result.reps}</div><div className="sub">Same design, new random data</div></div>
        <div className="card stat"><div className="label">Average estimate</div><div className="big">{result.mean.toFixed(2)}</div><div className="sub">True effect {truth.toFixed(2)} ({bias >= 0 ? '+' : ''}{bias.toFixed(2)} off)</div></div>
        <div className="card stat"><div className="label">Intervals containing the truth</div><div className={`big ${result.coverage >= 0.9 ? 'green' : ''}`}>{pct(result.coverage)}</div><div className="sub">A 95% interval should be near 95%</div></div>
        <div className="card stat"><div className="label">Significant at 5%</div><div className="big">{pct(result.significantRate)}</div><div className="sub">{truth === 0 ? 'False-positive rate' : 'Power for this design'}</div></div>
      </div>
      <section className="card">
        <h2>Distribution of estimates</h2>
        <div className="chart" role="img" aria-label={`Histogram of ${result.reps} DiD estimates; true effect ${truth.toFixed(2)}, average ${result.mean.toFixed(2)}`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bins} margin={{ top: 16, right: 16, bottom: 8, left: 0 }} barCategoryGap={1}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="mid" type="number" domain={[bins[0].from, bins[bins.length - 1].to]} tickFormatter={(v: number) => v.toFixed(1)} />
              <YAxis allowDecimals={false} width={36} />
              <Bar dataKey="count" isAnimationActive={false}>
                {bins.map((b) => <Cell key={b.mid} fill={b.from <= estimate && estimate <= b.to ? 'var(--color-accent)' : 'var(--color-comparison)'} />)}
              </Bar>
              <ReferenceLine x={truth} stroke="var(--color-counterfactual)" strokeWidth={2} strokeDasharray="4 3" label={{ value: `True ${truth.toFixed(2)}`, position: 'top', fontSize: 11, fill: 'var(--color-counterfactual)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="muted small">The dark bar holds your original estimate ({estimate.toFixed(2)}). Each run is a different random sample, so even a correct method gives different answers.</p>
        <div className="explain">
          {Math.abs(bias) < 0.25 * Math.max(result.sd, 0.01) + 0.05
            ? <>Across {result.reps} runs the estimates centre on the true effect, and about {pct(result.coverage)} of the 95% intervals contain it. A single run can still land well off: the spread (SD {result.sd.toFixed(2)}) is the uncertainty your confidence interval is describing.</>
            : <>The estimates centre on {result.mean.toFixed(2)}, not the true effect of {truth.toFixed(2)}, and only {pct(result.coverage)} of the intervals contain the truth. Repeating the study does not fix this: a bias from a broken assumption such as parallel trends does not average out.</>}
        </div>
      </section>
    </>
  )
}
