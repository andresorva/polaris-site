/**
 * Auth-aware request helpers for POLARIS.
 *
 * The base `client.ts` (apiGet/apiPost) is the shared core (owned elsewhere)
 * and does NOT inject an Authorization header nor expose PATCH. This module
 * layers ONLY what the new endpoints need on top of the same base URL +
 * retry/timeout semantics, WITHOUT modifying client.ts:
 *
 * - Bearer-token storage in localStorage (key `polaris_token`).
 * - `apiAuthGet` / `apiAuthPost` / `apiAuthPatch` that attach the token when
 *   present (so /auth/me, PATCH /alerts/{id}, etc. authenticate).
 *
 * Constraints mirror client.ts:
 * - 4xx -> fail fast (no retry).
 * - 5xx / network / timeout -> retry with 1s, 2s backoff (3 attempts max).
 * - 10s timeout via AbortController.
 *
 * REGLA 79: all source comments/strings here stay ASCII (no accents / no enie).
 */

import { ApiError } from './client'

const DEFAULT_BASE_URL = 'https://web-production-d6505.up.railway.app'
const DEFAULT_TIMEOUT_MS = 10_000
const MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 1_000

/** localStorage key for the bearer access token issued by POST /auth/login. */
export const TOKEN_KEY = 'polaris_token'

// ---------------------------------------------------------------------------
// Token storage (localStorage, SSR/test safe)
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* localStorage unavailable */
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* localStorage unavailable */
  }
}

// ---------------------------------------------------------------------------
// Internal request runner (same semantics as client.ts request())
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  return env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const base = getBaseUrl().replace(/\/$/, '')
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type HttpMethod = 'GET' | 'POST' | 'PATCH'

interface AuthRequestOptions {
  method: HttpMethod
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  /** Attach Authorization: Bearer <token> when a token is stored. Default true. */
  withAuth?: boolean
  timeoutMs?: number
}

async function authRequest<T>(path: string, opts: AuthRequestOptions): Promise<T> {
  const url = buildUrl(path, opts.params)
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const withAuth = opts.withAuth ?? true

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
      if (withAuth) {
        const token = getToken()
        if (token) headers.Authorization = `Bearer ${token}`
      }

      const init: RequestInit = {
        method: opts.method,
        headers,
        signal: controller.signal,
      }
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body)

      const res = await fetch(url, init)
      clearTimeout(timeoutId)

      let parsed: unknown = undefined
      const text = await res.text()
      if (text.length > 0) {
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = text
        }
      }

      if (res.ok) return parsed as T

      if (res.status >= 400 && res.status < 500) {
        throw new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`, parsed)
      }

      lastError = new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`, parsed)
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err
      }
      if (err instanceof ApiError) {
        lastError = err
      } else if (err instanceof Error && err.name === 'AbortError') {
        lastError = new ApiError(0, `Request timeout after ${timeoutMs}ms`)
      } else {
        lastError = new ApiError(0, err instanceof Error ? err.message : 'Network error')
      }
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError(0, 'Unknown error after retries')
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function apiAuthGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  withAuth = true,
): Promise<T> {
  return authRequest<T>(path, { method: 'GET', params, withAuth })
}

export function apiAuthPost<T, B = unknown>(
  path: string,
  body: B,
  params?: Record<string, string | number | boolean | undefined>,
  withAuth = true,
): Promise<T> {
  return authRequest<T>(path, { method: 'POST', body, params, withAuth })
}

export function apiAuthPatch<T, B = unknown>(
  path: string,
  body: B,
  params?: Record<string, string | number | boolean | undefined>,
  withAuth = true,
): Promise<T> {
  return authRequest<T>(path, { method: 'PATCH', body, params, withAuth })
}
