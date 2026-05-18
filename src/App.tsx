import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './features/client-theme/ThemeProvider'
import DevComponentsPage from './routes/dev/components'

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-ink">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">POLARIS</h1>
        <p className="mt-4 text-xl font-mono text-ink-muted">
          Political Analytics &amp; Real-time Intelligence System
        </p>
        <p className="mt-2 text-sm text-ink-subtle">v2.0.0-rebuild</p>
        <p className="mt-8">
          <Link
            to="/dev/components"
            className="text-sm font-mono underline text-primary hover:text-primary-dark"
          >
            /dev/components
          </Link>
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dev/components" element={<DevComponentsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
