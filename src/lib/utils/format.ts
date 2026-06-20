/**
 * Locale-aware formatting helpers for POLARIS UI.
 *
 * All defaults target es-MX (Carlos demo is in Mexico). Caller can override
 * locale per-call.
 *
 * REGLA 79: the design-v3 helpers below (formatDateEsMx, formatPct,
 * relativeTime) emit ASCII-only strings — a e i o u n, no accents / n-tilde.
 * The legacy Intl-based helpers (formatDate, formatRelativeTime, ...) are kept
 * untouched for existing callers; prefer the v3 helpers in new screens.
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

// ---------------------------------------------------------------------------
// Design-v3 ASCII helpers (REGLA 79). No accents, no n-with-tilde.
// Built without Intl es-MX output (which carries accents like "miércoles" /
// "sábado") so the produced strings are guaranteed ASCII.
// ---------------------------------------------------------------------------

// 3-letter ASCII weekday labels, index 0 = Sunday (matches Date.getDay()).
const WEEKDAY_ABBR_ES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

// 3-letter ASCII month labels, index 0 = January (matches Date.getMonth()).
const MONTH_ABBR_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

/**
 * Coerce assorted date inputs to a local-time Date.
 *
 * A bare "YYYY-MM-DD" is parsed as LOCAL midnight (not UTC) to avoid the
 * off-by-one-day shift that `new Date('2026-06-18')` produces in tz behind UTC.
 */
function toLocalDate(input: string | number | Date | null | undefined): Date | null {
  if (input === null || input === undefined) return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  if (typeof input === 'number') {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (dateOnly) {
    const [, y, m, day] = dateOnly
    const d = new Date(Number(y), Number(m) - 1, Number(day))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Short ASCII es-MX date: "Mie 18 Jun".
 *
 * Accepts ISO strings, "YYYY-MM-DD", epoch ms, or Date. Null / invalid -> "—".
 * `withYear` appends the year: "Mie 18 Jun 2026".
 */
export function formatDateEsMx(
  input: string | number | Date | null | undefined,
  opts: { withYear?: boolean } = {},
): string {
  const d = toLocalDate(input)
  if (!d) return '—'
  const wd = WEEKDAY_ABBR_ES[d.getDay()]
  const mo = MONTH_ABBR_ES[d.getMonth()]
  const base = `${wd} ${d.getDate()} ${mo}`
  return opts.withYear ? `${base} ${d.getFullYear()}` : base
}

/**
 * Percent formatter. The input is treated as an ALREADY-SCALED percentage
 * (e.g. 42.7 -> "42.7%"), matching backend fields like `pct_neg`.
 *
 * `decimals` defaults to 1. Null / invalid -> "—". Output is ASCII.
 */
export function formatPct(
  n: number | null | undefined,
  decimals = 1,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const fixed = n.toFixed(decimals)
  // Drop a trailing ".0" / ".00" so whole numbers read cleanly.
  const tidy = decimals > 0 ? fixed.replace(/\.0+$/, '') : fixed
  return `${tidy}%`
}

/**
 * ASCII relative-time, es-MX flavored, no accents.
 *
 * "hace 5 min", "hace 2 h", "hace 3 dias", "en 4 h". Past >30d falls back to
 * the short ASCII date. Null / invalid -> "—".
 */
export function relativeTime(
  input: string | number | Date | null | undefined,
  now: Date = new Date(),
): string {
  const d = toLocalDate(input)
  if (!d) return '—'

  const diffMs = d.getTime() - now.getTime()
  const past = diffMs <= 0
  const absSec = Math.abs(Math.round(diffMs / 1000))

  const phrase = (qty: number, unit: string): string =>
    past ? `hace ${qty} ${unit}` : `en ${qty} ${unit}`

  if (absSec < 45) return past ? 'hace un momento' : 'en un momento'
  if (absSec < 3600) {
    const m = Math.max(1, Math.round(absSec / 60))
    return phrase(m, 'min')
  }
  if (absSec < 86_400) {
    const h = Math.round(absSec / 3600)
    return phrase(h, 'h')
  }
  if (absSec < 86_400 * 30) {
    const days = Math.round(absSec / 86_400)
    return phrase(days, days === 1 ? 'dia' : 'dias')
  }
  return formatDateEsMx(d)
}
