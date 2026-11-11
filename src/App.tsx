import { Learn } from './features/learn/Learn'
import { LessonPlayer } from './features/learn/LessonPlayer'
import { Designer } from './features/lab/Designer'
import { Home } from './features/home/Home'
import { ResultsDetail, ResultsList } from './features/results/Results'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/learn', label: 'Learn' },
  { to: '/lab', label: 'Lab' },
  { to: '/results', label: 'Results' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">Dwene</div>
          <nav className="nav">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:lessonId" element={<LessonPlayer />} />
            <Route path="/lab" element={<Designer />} />
            <Route path="/results" element={<ResultsList />} />
            <Route path="/results/:id" element={<ResultsDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
