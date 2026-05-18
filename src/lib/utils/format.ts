/**
 * Locale-aware formatting helpers for POLARIS UI.
 *
 * All defaults target es-MX (Carlos demo is in Mexico). Caller can override
 * locale per-call.
 */

const DEFAULT_LOCALE = 'es-MX'

export interface FormatNumberOpts {
  compact?: boolean
  decimals?: number
  locale?: string
}

export function formatNumber(
  n: number | null | undefined,
  opts: FormatNumberOpts = {},
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const { compact = false, decimals, locale = DEFAULT_LOCALE } = opts
  return new Intl.NumberFormat(locale, {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals ?? (compact ? 1 : 0),
    minimumFractionDigits: decimals ?? 0,
  }).format(n)
}

export function formatPercent(
  n: number | null | undefined,
  decimals = 1,
  locale: string = DEFAULT_LOCALE,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n / 100)
}

export function formatDate(
  iso: string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(
  iso: string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Relative-time strings ("hace 2 horas", "hace 3 días"). Falls back to absolute
 * date for >30d (relative gets noisy at that scale).
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  locale: string = DEFAULT_LOCALE,
  now: Date = new Date(),
): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  const diffMs = d.getTime() - now.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const absSec = Math.abs(diffSec)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (absSec < 60) return rtf.format(diffSec, 'second')
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (absSec < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (absSec < 86_400 * 30) return rtf.format(Math.round(diffSec / 86_400), 'day')
  return formatDate(iso, locale)
}
