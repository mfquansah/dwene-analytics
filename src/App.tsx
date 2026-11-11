import { BookOpen, FlaskConical, House, BarChart3 } from 'lucide-react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { LogoMark } from './components/Logo'
import { Home } from './features/home/Home'
import { Designer } from './features/lab/Designer'
import { Playground } from './features/lab/Playground'
import { Learn } from './features/learn/Learn'
import { LessonPlayer } from './features/learn/LessonPlayer'
import { ResultsDetail, ResultsList } from './features/results/Results'

const nav = [
  { to: '/', label: 'Home', icon: House },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/lab', label: 'Lab', icon: FlaskConical },
  { to: '/results', label: 'Results', icon: BarChart3 },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand"><LogoMark />Dwene</div>
          <nav className="nav" aria-label="Main">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'}>
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">Your experiments and progress are saved in this browser only.</div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:lessonId" element={<LessonPlayer />} />
            <Route path="/lab" element={<Designer />} />
            <Route path="/lab/run/:id" element={<Playground />} />
            <Route path="/results" element={<ResultsList />} />
            <Route path="/results/:id" element={<ResultsDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
