import { Link } from 'react-router-dom'
import { useAppState } from '../../storage/store'

export function Home() {
  const { experiments } = useAppState()
  return (
    <div className="page">
      <h1>Better experiments. Brighter products.</h1>
      <p className="muted">Learn the logic of causal inference, then test it on data where you know the truth. Starting with difference-in-differences.</p>
      <div className="grid2">
        <section className="card">
          <h2>Learn mode</h2>
          <p className="muted">Five short, hands-on lessons that start from a real business problem.</p>
          <Link to="/learn" className="btn ghost">Start learning</Link>
        </section>
        <section className="card">
          <h2>Lab mode</h2>
          <p className="muted">Design a study, simulate data with a known effect, and see whether DiD recovers it.</p>
          <Link to="/lab" className="btn primary">New experiment</Link>
        </section>
      </div>
      <section className="card">
        <h2>Recent experiments</h2>
        {experiments.length === 0 ? <p className="muted">Nothing yet.</p> : (
          <ul className="list">{experiments.slice(0, 5).map((e) => (
            <li key={e.id}><Link to={`/results/${e.id}`} className="link">{e.name}</Link><span className="muted">{new Date(e.createdAt).toLocaleDateString()}</span></li>
          ))}</ul>
        )}
      </section>
    </div>
  )
}
