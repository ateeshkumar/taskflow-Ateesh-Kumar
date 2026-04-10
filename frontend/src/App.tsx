import { Navigate, Route, Routes } from 'react-router-dom'
import ProjectDetail from './pages/ProjectDetail'
import Projects from './pages/Projects'
import Login from './pages/Login'
import Register from './pages/Register'
import { useSession } from './hooks/useSession'
import { useTheme } from './hooks/useTheme'
import { ghostButton, pageContainer, surfacePage, themeToggleButton } from './ui'

export default function App() {
  const { user, handleLogin, handleLogout } = useSession()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={surfacePage}>
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur dark:border-white/10 dark:bg-slate-950/85 dark:text-white">
        <div className={`${pageContainer} flex items-center gap-4 py-4`}>
          <div className="text-xl font-extrabold tracking-[0.02em]">TaskFlow</div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className={themeToggleButton} onClick={toggleTheme} type="button">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            {user ? (
              <>
                <span className="text-sm text-slate-600 dark:text-white/85">{user.name}</span>
                <button className={ghostButton} onClick={handleLogout} type="button">
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className={pageContainer}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/projects" replace /> : <Login onSuccess={handleLogin} />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/projects" replace /> : <Register onSuccess={handleLogin} />}
          />
          <Route
            path="/projects"
            element={user ? <Projects /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/projects/:id"
            element={user ? <ProjectDetail /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to={user ? '/projects' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}
