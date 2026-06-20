import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './features/client-theme/ThemeProvider'
import { RequireAuth } from './features/auth/RequireAuth'
import { queryClient } from './lib/api/queryClient'

const LoginPage = lazy(() => import('./routes/login'))
const DevComponentsPage = lazy(() => import('./routes/dev/components'))
const AppShell = lazy(() => import('./components/layout/AppShell'))
const VistaGeneral = lazy(() => import('./routes/dashboard/index'))
const Pulso = lazy(() => import('./routes/dashboard/pulso'))
const Sentiment = lazy(() => import('./routes/dashboard/sentiment'))
const Temas = lazy(() => import('./routes/dashboard/temas'))
const Voces = lazy(() => import('./routes/dashboard/voces'))
const Alertas = lazy(() => import('./routes/dashboard/alertas'))
const Briefing = lazy(() => import('./routes/dashboard/briefing'))
const Fuentes = lazy(() => import('./routes/dashboard/fuentes'))
const Ajustes = lazy(() => import('./routes/dashboard/ajustes'))
const Showcase = lazy(() => import('./routes/dashboard/showcase'))
const NotFound = lazy(() => import('./routes/not-found'))

function PageFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-surface text-ink"
      role="status"
      aria-label="Cargando"
    >
      <div className="text-xs font-mono text-ink-subtle">Cargando...</div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dev/components" element={<DevComponentsPage />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<VistaGeneral />} />
                <Route path="pulso" element={<Pulso />} />
                <Route path="sentiment" element={<Sentiment />} />
                <Route path="temas" element={<Temas />} />
                <Route path="voces" element={<Voces />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="briefing" element={<Briefing />} />
                <Route path="fuentes" element={<Fuentes />} />
                <Route path="ajustes" element={<Ajustes />} />
                <Route path="showcase" element={<Showcase />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
