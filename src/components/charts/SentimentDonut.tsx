/**
 * SentimentDonut - conic-gradient donut of sentiment distribution.
 *
 * Pure CSS (conic-gradient ring + masked hole), zero chart deps. Renders the
 * four honest states (loading / empty / error / data). Colors come from the
 * --sent-* CSS vars (Wave 1). REGLA 79: all visible strings are ASCII.
 *
 * Import by ruta directa:
 *   import { SentimentDonut } from '../charts/SentimentDonut'
 */

import { Card } from '../ui/Card'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import {
  SENTIMENT_CATS,
  fmtInt,
  fmtPct,
  sumCounts,
  type SentimentBucketKey,
  type SentimentCounts,
} from './sentimentColors'

type Props = {
  counts?: SentimentCounts | null
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Diameter of the donut in px. */
  size?: number
  /** Center big number. Defaults to total mentions. */
  centerValue?: string | number
  /** Center caption under the big number. */
  centerLabel?: string
  /** Show the legend column to the right of the donut. */
  showLegend?: boolean
  className?: string
  ariaLabel?: string
}

type Segment = {
  key: SentimentBucketKey
  label: string
  color: string
  value: number
  pct: number
  from: number
  to: number
}

function buildConicGradient(segments: Segment[]): string {
  if (segments.length === 0) return 'var(--bg-sunken)'
  const stops = segments
    .map((s) => `${s.color} ${s.from.toFixed(2)}% ${s.to.toFixed(2)}%`)
    .join(', ')
  return `conic-gradient(${stops})`
}

export function SentimentDonut({
  counts,
  loading = false,
  error = false,
  onRetry,
  size = 200,
  centerValue,
  centerLabel = 'menciones',
  showLegend = true,
  className,
  ariaLabel = 'Distribucion de sentimiento',
}: Props) {
  if (loading) {
    return (
      <Card className={className}>
        <div
          className="flex items-center gap-6"
          role="status"
          aria-label="Cargando grafico de sentimiento"
        >
          <div
            className="animate-pulse rounded-full bg-sunken shrink-0"
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
          {showLegend ? (
            <div className="flex-1 space-y-3" aria-hidden="true">
              {SENTIMENT_CATS.map((c) => (
                <div
                  key={c.key}
                  className="h-3 rounded bg-sunken animate-pulse"
                  style={{ width: `${60 + (c.key.length % 4) * 8}%` }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <ErrorState
          title="No se pudo cargar el sentimiento"
          description="Hubo un problema al obtener la distribucion. Intenta de nuevo."
          onRetry={onRetry}
        />
      </Card>
    )
  }

  const total = counts ? sumCounts(counts) : 0
  if (!counts || total <= 0) {
    return (
      <Card className={className}>
        <EmptyState
          title="Sin menciones"
          description="No hay menciones en el rango seleccionado para mostrar la distribucion de sentimiento."
        />
      </Card>
    )
  }

  // Build ordered, non-empty segments with cumulative conic stops.
  let cursor = 0
  const segments: Segment[] = []
  for (const cat of SENTIMENT_CATS) {
    const value = counts[cat.key] ?? 0
    if (value <= 0) continue
    const pct = (value / total) * 100
    const from = cursor
    const to = cursor + pct
    cursor = to
    segments.push({
      key: cat.key,
      label: cat.label,
      color: cat.color,
      value,
      pct,
      from,
      to,
    })
  }

  const ring = buildConicGradient(segments)
  const center = centerValue ?? fmtInt(total)
  const ariaSummary = segments
    .map((s) => `${s.label} ${fmtPct(s.pct, 0)}`)
    .join(', ')

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center gap-6">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
          role="img"
          aria-label={`${ariaLabel}: ${ariaSummary}`}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: ring }}
            aria-hidden="true"
          />
          {/* Hole - sits on card bg to carve the donut. */}
          <div
            className="absolute rounded-full bg-card flex flex-col items-center justify-center"
            style={{ inset: size * 0.18 }}
            aria-hidden="true"
          >
            <div className="font-mono font-semibold leading-none text-ink text-2xl tabular-nums">
              {center}
            </div>
            {centerLabel ? (
              <div className="mt-1 text-[10px] uppercase tracking-wide text-ink-subtle">
                {centerLabel}
              </div>
            ) : null}
          </div>
        </div>

        {showLegend ? (
          <ul className="flex-1 min-w-[140px] space-y-2.5">
            {segments.map((s) => (
              <li
                key={s.key}
                className="flex items-center gap-2.5 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-[3px] shrink-0"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span className="text-ink-muted">{s.label}</span>
                <span className="ml-auto font-mono font-semibold text-ink tabular-nums">
                  {fmtInt(s.value)}
                </span>
                <span className="w-12 text-right font-mono text-[11px] text-ink-subtle tabular-nums">
                  {fmtPct(s.pct)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  )
}
