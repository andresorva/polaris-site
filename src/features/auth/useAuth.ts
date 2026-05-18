import { useCallback, useEffect, useState } from 'react'

const SESSION_KEY = 'polaris_session'

export type Session = {
  user: string
  loggedAt: number
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'user' in parsed &&
      typeof (parsed as Session).user === 'string' &&
      'loggedAt' in parsed &&
      typeof (parsed as Session).loggedAt === 'number'
    ) {
      return parsed as Session
    }
    return null
  } catch {
    return null
  }
}

export function saveSession(user: string): Session {
  const session: Session = { user, loggedAt: Date.now() }
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
  return session
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export type UseAuth = {
  isAuthenticated: boolean
  user: string | null
  logout: () => void
}

export function useAuth(): UseAuth {
  const [session, setSession] = useState<Session | null>(() => readSession())

  // Sync across tabs / re-mounts
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === SESSION_KEY) {
        setSession(readSession())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    if (typeof window !== 'undefined') {
      window.location.assign('/login')
    }
  }, [])

  return {
    isAuthenticated: session !== null,
    user: session?.user ?? null,
    logout,
  }
}
