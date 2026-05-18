import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth, saveSession } from '../features/auth/useAuth'

type LoginForm = {
  username: string
  password: string
}

type LocationState = {
  from?: { pathname: string }
}

const DEMO_USERS = [
  import.meta.env.VITE_DEMO_USER_1,
  import.meta.env.VITE_DEMO_USER_2,
].filter((u): u is string => typeof u === 'string' && u.length > 0)

const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined

function validateCreds(username: string, password: string): boolean {
  if (!DEMO_PASSWORD) return false
  if (!DEMO_USERS.includes(username)) return false
  return password === DEMO_PASSWORD
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { username: '', password: '' },
  })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = (values: LoginForm) => {
    setAuthError(null)
    const ok = validateCreds(values.username.trim(), values.password)
    if (!ok) {
      setAuthError('Usuario o contrasena invalidos.')
      return
    }
    saveSession(values.username.trim())
    const from = (location.state as LocationState | null)?.from?.pathname
    navigate(from && from.startsWith('/dashboard') ? from : '/dashboard', {
      replace: true,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-ink px-4">
      <Card padded className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">POLARIS</h1>
          <p className="mt-1 text-xs font-mono text-ink-muted">
            Political Analytics &amp; Real-time Intelligence System
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-mono text-ink-muted mb-1"
            >
              Usuario
            </label>
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              invalid={Boolean(errors.username)}
              {...register('username', {
                required: 'El usuario es requerido.',
              })}
            />
            {errors.username ? (
              <p className="mt-1 text-xs text-sentiment-negative">
                {errors.username.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono text-ink-muted mb-1"
            >
              Contrasena
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              {...register('password', {
                required: 'La contrasena es requerida.',
              })}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-sentiment-negative">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {authError ? (
            <div
              role="alert"
              className="rounded-md border border-sentiment-negative/30 bg-sentiment-negative/10 px-3 py-2 text-xs text-sentiment-negative"
            >
              {authError}
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] font-mono text-ink-subtle">
          Demo · Track 1 · Fase 2
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
