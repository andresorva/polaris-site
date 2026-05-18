import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CLIENTS,
  DEFAULT_CLIENT_ID,
  getClientById,
  type ClientTheme,
} from './clients'
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemeMode,
} from './themeContext'

const STORAGE_CLIENT_KEY = 'polaris_client_id'
const STORAGE_THEME_KEY = 'polaris_theme'

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientIdState] = useState<string>(() => readClientFromStorage())
  const [mode, setModeState] = useState<ThemeMode>(() => readModeFromStorage())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  const client = useMemo<ClientTheme>(() => {
    return getClientById(clientId) ?? CLIENTS[0]!
  }, [clientId])

  const resolvedTheme = resolveTheme(mode, systemTheme)

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

  // Apply client theme as CSS vars
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--polaris-primary', client.primary)
    root.style.setProperty('--polaris-primary-dark', client.primary_dark)
    root.style.setProperty('--polaris-primary-light', client.primary_light)
    root.style.setProperty('--polaris-accent', client.accent)
  }, [client])

  // Apply data-theme attribute
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [resolvedTheme])

  const setClient = useCallback((id: string) => {
    if (!getClientById(id)) return
    setClientIdState(id)
    try {
      window.localStorage.setItem(STORAGE_CLIENT_KEY, id)
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
      setClient,
      setMode,
    }),
    [client, mode, resolvedTheme, setClient, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
