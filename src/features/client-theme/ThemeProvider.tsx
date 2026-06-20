import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  CLIENTS,
  DEFAULT_CLIENT_ID,
  getClientById,
  type ClientTheme,
  type PartySlug,
} from './clients'
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemeMode,
} from './themeContext'

// Storage keys.
//  - STORAGE_PARTY_KEY ('polaris-party'): contrato de la card T0.2. Guarda el
//    slug de partido activo del cliente seleccionado.
//  - STORAGE_CLIENT_KEY ('polaris_client_id'): se mantiene en sync para que el
//    anti-FOUC inline de index.html (que ya lee esta llave) siga funcionando.
const STORAGE_CLIENT_KEY = 'polaris_client_id'
const STORAGE_PARTY_KEY = 'polaris-party'
const STORAGE_THEME_KEY = 'polaris_theme'

// Duracion de la transicion multi-tenant (~420ms, alineada con --theme-transition).
const THEME_TRANSITION_MS = 420

type StartViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => unknown
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readClientFromStorage(): string {
  if (typeof window === 'undefined') return DEFAULT_CLIENT_ID
  try {
    const stored = window.localStorage.getItem(STORAGE_CLIENT_KEY)
    if (stored && getClientById(stored)) return stored
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_CLIENT_ID
}

function readModeFromStorage(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(STORAGE_THEME_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    /* localStorage unavailable */
  }
  return 'system'
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return mode === 'system' ? systemTheme : mode
}

/** Aplica el cliente activo al <html>: data-party + tokens de marca inline. */
function applyClientToDom(client: ClientTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-party', client.party_slug satisfies PartySlug)
  root.style.setProperty('--polaris-primary', client.primary)
  root.style.setProperty('--polaris-primary-dark', client.primary_dark)
  root.style.setProperty('--polaris-primary-light', client.primary_light)
  root.style.setProperty('--polaris-accent', client.accent)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientIdState] = useState<string>(() => readClientFromStorage())
  const [mode, setModeState] = useState<ThemeMode>(() => readModeFromStorage())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())
  // Evita disparar la transicion en el primer render (boot): el DOM ya viene
  // tintado por el anti-FOUC de index.html, no hay nada que animar.
  const mountedRef = useRef(false)

  const client = useMemo<ClientTheme>(() => {
    return getClientById(clientId) ?? CLIENTS[0]!
  }, [clientId])

  const resolvedTheme = resolveTheme(mode, systemTheme)

  // Activa data-animate-theme desde el boot para que los tokens de color de
  // marca animen (transicion suave) en cualquier cambio posterior.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-animate-theme', '')
  }, [])

  // Watch system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Apply client theme (data-party + CSS vars). En el primer mount aplica sin
  // transicion; en cambios posteriores usa View Transition API si existe.
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (!mountedRef.current) {
      mountedRef.current = true
      applyClientToDom(client)
      return
    }

    const doc = document as StartViewTransitionDoc
    if (typeof doc.startViewTransition === 'function' && !prefersReducedMotion()) {
      // Cross-fade de toda la app mientras re-tinta (~420ms via CSS @property).
      doc.startViewTransition(() => {
        applyClientToDom(client)
      })
    } else {
      applyClientToDom(client)
    }
  }, [client])

  // Apply data-theme attribute (light/dark)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [resolvedTheme])

  /** Cambia el cliente/partido activo. Persiste y re-tinta con transicion. */
  const setParty = useCallback((id: string) => {
    const next = getClientById(id)
    if (!next) return
    setClientIdState(id)
    try {
      window.localStorage.setItem(STORAGE_CLIENT_KEY, id)
      window.localStorage.setItem(STORAGE_PARTY_KEY, next.party_slug)
    } catch {
      /* ignore */
    }
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      window.localStorage.setItem(STORAGE_THEME_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      client,
      clients: CLIENTS,
      mode,
      resolvedTheme,
      setParty,
      // Alias historico: el resto del codigo (ClientSelector, dev/components)
      // sigue llamando setClient. Apunta a la misma logica.
      setClient: setParty,
      setMode,
    }),
    [client, mode, resolvedTheme, setParty, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export { THEME_TRANSITION_MS }
