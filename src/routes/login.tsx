import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth, saveSession } from '../features/auth/useAuth'
import { useClientTheme } from '../features/client-theme/useClientTheme'
import { useLogin } from '../lib/api/queries'

// ===========================================================================
// POLARIS Login v3 (mockup 03-login.html)
// - Hero constelacion + RadarMark a la izquierda, formulario a la derecha.
// - 5 estados visuales: typing (idle) / loading / error (shake) / success
//   (check + veil) sobre el mismo formulario.
// - Auth client-side EXISTENTE intacto: validateCreds + saveSession +
//   RequireAuth (Navigate cuando ya hay sesion). localStorage.polaris_session.
// - Adicional best-effort: en login OK dispara useLogin para guardar el token
//   backend via setToken; si falla NO bloquea (sigue client-side).
// - REGLA 79: cero acentos / enie en strings visibles.
// ===========================================================================

type LoginForm = {
  username: string
  password: string
}

type LocationState = {
  from?: { pathname: string }
}

type LoginStatus = 'idle' | 'loading' | 'error' | 'success'

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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// Marcas SVG (inline; el login no monta el AppShell que trae el RadarMark).
// ---------------------------------------------------------------------------

function RadarMark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="27"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <g className="polaris-radar-sweep" style={{ transformOrigin: '50% 50%' }}>
        <path d="M50 50 L50 5 A45 45 0 0 1 85 25 Z" fill="currentColor" opacity="0.22" />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      <circle cx="70" cy="32" r="4" fill="currentColor" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>
  )
}

function Constellation() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.85]"
      viewBox="0 0 300 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="rgba(255,255,255,0.28)" strokeWidth="1">
        <line x1="40" y1="60" x2="120" y2="110" />
        <line x1="120" y1="110" x2="90" y2="200" />
        <line x1="120" y1="110" x2="210" y2="90" />
        <line x1="210" y1="90" x2="250" y2="180" />
        <line x1="90" y1="200" x2="170" y2="250" />
        <line x1="170" y1="250" x2="250" y2="180" />
        <line x1="170" y1="250" x2="130" y2="320" />
      </g>
      <circle cx="120" cy="110" r="3.5" fill="var(--polaris-primary-light)" />
      <circle cx="170" cy="250" r="3" fill="var(--polaris-primary-light)" />
      <g fill="rgba(255,255,255,0.85)">
        <circle cx="40" cy="60" r="2" />
        <circle cx="210" cy="90" r="2.5" />
        <circle cx="90" cy="200" r="2" />
        <circle cx="250" cy="180" r="2.5" />
        <circle cx="130" cy="320" r="2" />
      </g>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6 0 10 7 10 7a17.6 17.6 0 0 1-3.07 3.86M6.1 6.1A17.6 17.6 0 0 0 2 11s4 7 10 7a9 9 0 0 0 3.5-.72" />
      <path d="M14.1 14.1a3 3 0 0 1-4.24-4.24" />
      <path d="M2 2l20 20" />
    </svg>
  )
}

function ThemeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  )
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { resolvedTheme, setMode } = useClientTheme()
  const login = useLogin()

  const [status, setStatus] = useState<LoginStatus>('idle')
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const timersRef = useRef<number[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { username: '', password: '' },
  })

  // Limpia cualquier timer pendiente al desmontar.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const goToDashboard = () => {
    const from = (location.state as LocationState | null)?.from?.pathname
    navigate(from && from.startsWith('/dashboard') ? from : '/dashboard', {
      replace: true,
    })
  }

  const onSubmit = (values: LoginForm) => {
    setAuthError(null)
    const username = values.username.trim()
    const ok = validateCreds(username, values.password)

    if (!ok) {
      setStatus('error')
      setAuthError('Credenciales no validas.')
      // Sale del estado error tras la animacion de shake.
      const t = window.setTimeout(
        () => setStatus('idle'),
        prefersReducedMotion() ? 0 : 1600,
      )
      timersRef.current.push(t)
      return
    }

    // Estado loading -> validamos client-side (fuente de verdad) y, en paralelo,
    // intentamos el login backend best-effort (guarda token via setToken).
    setStatus('loading')

    // Persistimos la sesion client-side EXISTENTE (no se rompe el flujo actual).
    saveSession(username)

    // Best-effort backend: si falla, NO bloquea el acceso client-side.
    login.mutate(
      { username, password: values.password },
      {
        onError: () => {
          /* token backend no disponible: seguimos client-side */
        },
      },
    )

    // Pequena espera para que el spinner + check sean perceptibles.
    const t = window.setTimeout(
      () => {
        setStatus('success')
        const t2 = window.setTimeout(
          goToDashboard,
          prefersReducedMotion() ? 0 : 900,
        )
        timersRef.current.push(t2)
      },
      prefersReducedMotion() ? 0 : 700,
    )
    timersRef.current.push(t)
  }

  const onFieldInput = () => {
    if (status === 'error') {
      setStatus('idle')
      setAuthError(null)
    }
  }

  const isBusy = status === 'loading' || status === 'success'

  return (
    <div className="min-h-screen flex items-center justify-center bg-base text-ink px-4 py-8">
      <div
        className={[
          'relative w-full max-w-4xl overflow-hidden rounded-lg',
          'border border-border-strong bg-base shadow-strong',
          'grid grid-cols-1 md:grid-cols-[0.92fr_1.08fr]',
          status === 'error' && !prefersReducedMotion() ? 'polaris-login-shake' : '',
        ].join(' ')}
        data-state={status}
      >
        {/* ---------------- HERO (constelacion) ---------------- */}
        <div
          className="relative hidden md:flex flex-col justify-between overflow-hidden p-7 text-white"
          style={{
            background:
              'radial-gradient(75% 60% at 22% 8%, color-mix(in srgb, var(--polaris-primary) 40%, transparent), transparent 58%), radial-gradient(60% 50% at 90% 100%, color-mix(in srgb, var(--polaris-primary) 18%, transparent), transparent 60%), linear-gradient(165deg, #0E1828 0%, #0A111E 55%, #0C1322 100%)',
          }}
        >
          {/* trama de puntos */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)',
              backgroundSize: '22px 22px',
              maskImage: 'radial-gradient(80% 80% at 30% 40%, #000, transparent)',
              WebkitMaskImage:
                'radial-gradient(80% 80% at 30% 40%, #000, transparent)',
            }}
            aria-hidden="true"
          />
          <Constellation />

          <div className="relative flex items-center gap-2.5">
            <span
              className="block"
              style={{
                color: 'var(--polaris-primary-light)',
                filter:
                  'drop-shadow(0 0 10px color-mix(in srgb, var(--polaris-primary) 55%, transparent))',
              }}
            >
              <RadarMark size={40} />
            </span>
            <span className="text-sm font-bold tracking-[0.14em]">POLARIS</span>
          </div>

          <div className="relative">
            <h2 className="text-xl font-extrabold leading-tight tracking-tight md:text-2xl">
              Inteligencia politica.
              <br />
              Memoria total.
            </h2>
            <p className="mt-2 max-w-[30ch] text-xs opacity-80">
              El radar digital de cada conversacion que define tu gestion.
            </p>
          </div>
        </div>

        {/* ---------------- FORMULARIO ---------------- */}
        <div className="relative flex flex-col p-6 sm:p-8 md:p-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle">
              Acceso seguro
            </span>
            <button
              type="button"
              onClick={() => setMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title="Cambiar tema"
              aria-label="Cambiar tema"
              className="grid h-9 w-9 place-items-center rounded-full border border-border-subtle bg-[var(--bg-hover)] text-ink-muted transition-transform duration-300 ease-out hover:rotate-45 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ThemeIcon />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col justify-center gap-4 py-6"
            noValidate
            autoComplete="off"
          >
            <div className="max-w-sm">
              <h1 className="text-2xl font-extrabold tracking-tight">Bienvenido</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Ingresa para abrir tu radar.
              </p>
            </div>

            <div className="max-w-sm">
              <label
                htmlFor="username"
                className="mb-1 block text-xs font-mono text-ink-muted"
              >
                Usuario
              </label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                placeholder="usuario"
                disabled={isBusy}
                invalid={Boolean(errors.username)}
                {...register('username', {
                  required: 'El usuario es requerido.',
                  onChange: onFieldInput,
                })}
              />
              {errors.username ? (
                <p className="mt-1 text-xs text-sentiment-negative">
                  {errors.username.message}
                </p>
              ) : null}
            </div>

            <div className="max-w-sm">
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-mono text-ink-muted"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="********"
                  disabled={isBusy}
                  invalid={Boolean(errors.password)}
                  className="pr-11"
                  {...register('password', {
                    required: 'La password es requerida.',
                    onChange: onFieldInput,
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  title={showPw ? 'Ocultar' : 'Mostrar'}
                  aria-label={showPw ? 'Ocultar password' : 'Mostrar password'}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xs text-ink-subtle transition-colors hover:bg-[var(--bg-hover)] hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <EyeIcon open={!showPw} />
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-sentiment-negative">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {status === 'error' && authError ? (
              <div
                role="alert"
                className="flex max-w-sm items-center gap-2 text-xs font-medium text-sentiment-negative"
              >
                <ErrorIcon />
                {authError}
              </div>
            ) : null}

            <div className="max-w-sm">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={status === 'loading'}
                disabled={isBusy}
                style={
                  status === 'success'
                    ? { backgroundColor: 'var(--success)' }
                    : undefined
                }
              >
                {status === 'success' ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={
                        prefersReducedMotion() ? '' : 'polaris-check-draw'
                      }
                    >
                      <CheckIcon size={20} />
                    </span>
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </div>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="max-w-sm self-start text-xs font-medium text-primary hover:underline"
            >
              Olvide mi password
            </a>
          </form>

          <p className="text-[11px] leading-relaxed text-ink-subtle">
            <b className="font-semibold text-ink-muted">
              Inteligencia politica. Memoria total. Mexicana.
            </b>
            <br />
            Datanaat - POLARIS v2.0
          </p>

          {/* ---------------- VEIL de exito ---------------- */}
          {status === 'success' ? (
            <div
              className="absolute inset-0 z-10 grid place-items-center gap-3.5 text-center backdrop-blur-md"
              style={{ background: 'var(--bg-glass-strong)' }}
            >
              <div className="flex flex-col items-center gap-3.5">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full"
                  style={{
                    background: 'var(--success-soft)',
                    color: 'var(--success)',
                  }}
                >
                  <span
                    className={prefersReducedMotion() ? '' : 'polaris-check-draw'}
                  >
                    <CheckIcon size={30} />
                  </span>
                </div>
                <div>
                  <b className="block font-bold text-ink">Acceso concedido</b>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Abriendo Vista General...
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Animaciones locales (respetan prefers-reduced-motion via gating en JSX).
          No tocamos index.css: definimos los keyframes inline aqui. */}
      <style>{`
        @keyframes polaris-login-shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-8px); }
          40%,80% { transform: translateX(8px); }
        }
        .polaris-login-shake { animation: polaris-login-shake 0.42s ease-in-out; }
        @keyframes polaris-check-draw {
          from { stroke-dashoffset: 26; }
          to { stroke-dashoffset: 0; }
        }
        .polaris-check-draw path {
          stroke-dasharray: 26;
          animation: polaris-check-draw 0.5s ease-out forwards;
        }
        @keyframes polaris-radar-sweep {
          to { transform: rotate(360deg); }
        }
        .polaris-radar-sweep {
          animation: polaris-radar-sweep 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .polaris-login-shake,
          .polaris-check-draw path,
          .polaris-radar-sweep { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
