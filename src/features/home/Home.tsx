import { ArrowRight, FlaskConical, GraduationCap, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MiniTrend } from '../../components/MiniTrend'
import { estimateDiD, generateData, type SimParams } from '../../stats'
import { useAppState } from '../../storage/store'
import type { Experiment } from '../../storage/types'
import { DID_COURSE } from '../learn/content'
import { isLessonComplete } from '../learn/grading'
import { buildTrendSeries } from '../results/series'

const EXAMPLE: SimParams = { unitsPerGroup: 20, periods: 12, treatmentStart: 6, effectSize: 2, noise: 1.5, baselineDifference: 3, trendDifference: 0, seed: 123 }

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const METHODS = [
  { name: 'Difference-in-differences', level: 'Intermediate', to: '/learn' },
  { name: 'A/B testing', level: 'Beginner' },
  { name: 'Regression discontinuity', level: 'Intermediate' },
  { name: 'Propensity score matching', level: 'Advanced' },
  { name: 'Instrumental variables', level: 'Advanced' },
]

function HeroCard({ latest }: { latest: Experiment | undefined }) {
  const calc = useMemo(() => {
    const ds = generateData(latest?.params ?? EXAMPLE)
    return { did: estimateDiD(ds.data), series: buildTrendSeries(ds) }
  }, [latest])
  const e = calc.did.effect
  const sig = e.p < 0.05
  return (
    <div className="card hero-card">
      <div className="row between center">
        <span className="muted">{latest ? `Last experiment · ${latest.name}` : 'Example · simulated'}</span>
        <span className={`pill ${sig ? 'green' : 'amber'}`}>{sig ? 'Significant' : 'Not significant'}</span>
      </div>
      <div className="hero-metric"><span className="hero-number">{e.estimate >= 0 ? '+' : ''}{e.estimate.toFixed(2)}</span><span className="muted"> estimated effect</span></div>
      <MiniTrend series={calc.series} />
    </div>
  )
}

export function Home() {
  const { experiments, lessonProgress } = useAppState()
  const done = DID_COURSE.filter((l) => isLessonComplete(l, lessonProgress[l.lessonId]?.steps)).length
  const next = DID_COURSE.find((l) => !isLessonComplete(l, lessonProgress[l.lessonId]?.steps))
  const started = done > 0 || DID_COURSE.some((l) => Object.keys(lessonProgress[l.lessonId]?.steps ?? {}).length > 0)

  return (
    <div className="page">
      <div className="home-hero">
        <div>
          <p className="muted">{greeting()}</p>
          <h1 className="hero-title">Better experiments.<br />Brighter products.</h1>
          <p className="lead">Learn the logic of causal inference, then test it on data where you know the truth. Starting with difference-in-differences.</p>
        </div>
        <HeroCard latest={experiments[0]} />
      </div>

      <div className="grid2 modes">
        <section className="card wash-accent mode-card">
          <div className="row between center">
            <span className="icon-tile"><GraduationCap size={22} strokeWidth={1.6} color="var(--color-accent)" aria-hidden="true" /></span>
            <span className="muted small">{done} of {DID_COURSE.length} lessons · Difference-in-differences</span>
          </div>
          <h2 className="mode-title">Learn mode</h2>
          <p className="muted">Short, hands-on lessons that start from a real business problem and build intuition for counterfactuals, parallel trends and uncertainty.</p>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={DID_COURSE.length} aria-valuenow={done} aria-label="Course progress"><span style={{ width: `${(100 * done) / DID_COURSE.length}%` }} /></div>
          <Link to={next ? `/learn/${next.lessonId}` : '/learn'} className="btn primary mode-btn">{started ? 'Continue learning' : 'Start learning'}<ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
        <section className="card wash-blue mode-card">
          <div className="row between center">
            <span className="icon-tile"><FlaskConical size={22} strokeWidth={1.6} color="#2a62b5" aria-hidden="true" /></span>
            <span className="muted small">{experiments.length === 0 ? 'No experiments yet' : `${experiments.length} experiment${experiments.length > 1 ? 's' : ''}`}</span>
          </div>
          <h2 className="mode-title">Lab mode</h2>
          <p className="muted">Design a study, simulate data with a known ground truth, and see whether difference-in-differences recovers it.</p>
          <Link to="/lab" className="btn outline mode-btn">New experiment<Plus size={16} aria-hidden="true" /></Link>
        </section>
      </div>

      <div className="home-lower">
        <section className="card">
          <div className="row between center"><h2>Recent experiments</h2>{experiments.length > 0 && <Link to="/results" className="link">View all</Link>}</div>
          {experiments.length === 0 ? <p className="muted">Nothing yet. <Link to="/lab" className="link">Design your first experiment.</Link></p> : (
            <ul className="list exp-list">
              {experiments.slice(0, 4).map((e) => (
                <li key={e.id}>
                  <Link to={`/results/${e.id}`} className="exp-row">
                    <span className="exp-tile" aria-hidden="true" />
                    <span>
                      <span className="exp-name">{e.name} <span className="pill indigo">Diff-in-diff · Simulation</span></span>
                      <span className="muted small exp-meta">{e.params.unitsPerGroup * 2} units · {e.params.periods} periods · treatment at period {e.params.treatmentStart}</span>
                    </span>
                  </Link>
                  <span className="pill green">Completed</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Methods library</h2>
          <p className="muted small">Each method gets a lesson and a lab template. Difference-in-differences is first.</p>
          <ul className="methods">
            {METHODS.map((m) => (
              <li key={m.name}>
                {m.to ? <Link to={m.to} className="method-row"><span>{m.name}</span><span className="muted small">{m.level}</span></Link>
                  : <div className="method-row soon"><span>{m.name}</span><span className="muted small">Coming later</span></div>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
