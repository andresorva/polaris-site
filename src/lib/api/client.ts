/**
 * API client for POLARIS backend (FastAPI on Railway).
 *
 * Features:
 * - Generic typed `apiGet<T>` / `apiPost<T, B>`
 * - Exponential backoff retry on 5xx + network errors (1s / 2s — 3 attempts max)
 * - 10s timeout via AbortController
 * - Typed `ApiError` with status + body
 * - Reads base URL from `VITE_API_BASE_URL` (fallback hardcoded prod URL)
 * - Injects `Authorization: Bearer <token>` when a session token is present
 *
 * Constraints:
 * - 4xx errors throw immediately (no retry — client error, retry won't help)
 * - Aborted/timeout requests throw ApiError(0, ...)
 */

const DEFAULT_BASE_URL = 'https://web-production-d6505.up.railway.app'
const DEFAULT_TIMEOUT_MS = 10_000
const MAX_ATTEMPTS = 3 // 1 initial + 2 retries; delays 1s, 2s between
const RETRY_BASE_DELAY_MS = 1_000

export class ApiError extends Error {
  public readonly status: number
  public readonly body?: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function getBaseUrl(): string {
  // Vite injects env vars via import.meta.env. Fallback for non-Vite test contexts.
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  return env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL
}

/**
 * Storage key holding the bearer token issued by `POST /api/v1/auth/login`.
 *
 * // API PENDIENTE auth real — Wave 2 wires the login endpoint that persists
 * this token. Until then there is no token in storage and requests stay
 * anonymous (the header is simply omitted). The current mock auth
 * (`polaris_session`) holds no token, so nothing breaks before the real
 * endpoint lands; once Wave 2 writes `polaris_token`, requests pick it up
 * automatically without any further change here.
 */
const AUTH_TOKEN_KEY = 'polaris_token'

/**
 * Reads the bearer token from `localStorage`, defensively.
 *
 * - Returns `undefined` outside a browser (SSR / vitest node env) or when no
 *   token is stored.
 * - Accepts either a raw string token or a JSON blob shaped like
 *   `{ token | access_token: string }` (whichever Wave 2 ends up persisting),
 *   so the consumer side can change without touching this client.
 */
function getAuthToken(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined
  let raw: string | null
  try {
    raw = localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    // Private mode / disabled storage — stay anonymous.
    return undefined
  }
  if (!raw) return undefined
  // Fast path: a bare token string (not JSON).
  if (raw[0] !== '{') return raw
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>
      const token = obj.token ?? obj.access_token
      if (typeof token === 'string' && token.length > 0) return token
    }
  } catch {
    // Not JSON after all — treat the raw value as the token.
    return raw
  }
  return undefined
}

/**
 * Builds the `Authorization` header when a token is available. Returns an empty
 * object otherwise so callers can spread it unconditionally.
 */
function authHeader(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export { getAuthToken, AUTH_TOKEN_KEY }

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

interface RequestOptions {
  method: 'GET' | 'POST'
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  timeoutMs?: number
}

async function request<T>(path: string, opts: RequestOptions): Promise<T> {
  const url = buildUrl(path, opts.params)
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const init: RequestInit = {
        method: opts.method,
        headers: {
          Accept: 'application/json',
          ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          // // API PENDIENTE auth real — Bearer added when a token is stored.
          ...authHeader(),
        },
        signal: controller.signal,
      }
      if (opts.body !== undefined) {
        init.body = JSON.stringify(opts.body)
      }

      const res = await fetch(url, init)
      clearTimeout(timeoutId)

      // Parse body once (may be empty for 204)
      let parsed: unknown = undefined
      const text = await res.text()
      if (text.length > 0) {
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = text
        }
      }

      if (res.ok) {
        return parsed as T
      }

      // 4xx → fail fast, no retry
      if (res.status >= 400 && res.status < 500) {
        throw new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`, parsed)
      }

      // 5xx → retryable
      lastError = new ApiError(
        res.status,
        `HTTP ${res.status} ${res.statusText}`,
        parsed,
      )
    } catch (err) {
      clearTimeout(timeoutId)
      // 4xx ApiError → rethrow immediately
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err
      }
      // AbortError or network error → retryable
      if (err instanceof ApiError) {
        lastError = err
      } else if (err instanceof Error && err.name === 'AbortError') {
        lastError = new ApiError(0, `Request timeout after ${timeoutMs}ms`)
      } else {
        lastError = new ApiError(
          0,
          err instanceof Error ? err.message : 'Network error',
        )
      }
    }

    // Backoff before next attempt (1s, 2s) — skip after the last attempt
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError(0, 'Unknown error after retries')
}

export function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'GET', params })
}

export function apiPost<T, B = unknown>(
  path: string,
  body: B,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'POST', body, params })
}
