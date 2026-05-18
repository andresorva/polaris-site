/**
 * API client for POLARIS backend (FastAPI on Railway).
 *
 * Features:
 * - Generic typed `apiGet<T>` / `apiPost<T, B>`
 * - Exponential backoff retry on 5xx + network errors (1s / 2s — 3 attempts max)
 * - 10s timeout via AbortController
 * - Typed `ApiError` with status + body
 * - Reads base URL from `VITE_API_BASE_URL` (fallback hardcoded prod URL)
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
