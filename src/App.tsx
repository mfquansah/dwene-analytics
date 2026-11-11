import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/learn', label: 'Learn' },
  { to: '/lab', label: 'Lab' },
  { to: '/results', label: 'Results' },
]

function Placeholder({ title }: { title: string }) {
  return <h1>{title}</h1>
}

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
            <Route path="/" element={<Placeholder title="Home" />} />
            <Route path="/learn" element={<Placeholder title="Learn" />} />
            <Route path="/lab" element={<Placeholder title="Lab" />} />
            <Route path="/results" element={<Placeholder title="Results" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
