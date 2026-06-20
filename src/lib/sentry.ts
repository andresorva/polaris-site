import * as Sentry from '@sentry/react'

/**
 * Initializes Sentry only when a DSN is present. If VITE_SENTRY_DSN is not
 * injected at build time the init is a no-op, so the bundle stays inert in
 * environments that have not configured error reporting.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const release = import.meta.env.VITE_SENTRY_RELEASE

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    ...(release ? { release } : {}),
    tracesSampleRate: 0.1,
  })
}

/**
 * App-level error boundary. Re-exported from @sentry/react so callers have a
 * single import surface; works as a no-op wrapper when Sentry is uninitialized.
 */
export const ErrorBoundary = Sentry.ErrorBoundary
