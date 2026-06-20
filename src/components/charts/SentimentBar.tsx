/**
 * SentimentBar - a single stacked horizontal bar of sentiment shares.
 *
 * Low-level reusable primitive (the colored track) used by GlobalSentimentBar
 * and PlatformStackedBars, but also usable standalone. Pure CSS flex segments,
 * no chart deps. Four honest states. Colors from --sent-* (Wave 1).
 * REGLA 79: ASCII only.
 *
 * Import by ruta directa:
 *   import { SentimentBar } from '../charts/SentimentBar'
 */

import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { cn } from '../../lib/utils/cn'
import {
  SENTIMENT_CATS,
  fmtInt,
  fmtPct,
  sumCounts,
  type SentimentCounts,
} from './sentimentColors'

type Props = {
  counts?: SentimentCounts | null
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Track height in px. */
  height?: number
  /** Render the inline legend below the bar. */
  showLegend?: boolean
  className?: string
  ariaLabel?: string
}

export function SentimentBar({
  counts,
  loading = false,
  error = false,
  onRetry,
  height = 18,
  showLegend = false,
  className,
  ariaLabel = 'Distribucion de sentimiento',
}: Props) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-label="Cargando barra de sentimiento">
        <div
          className="w-full rounded-md bg-sunken animate-pulse"
          style={{ height }}
          aria-hidden="true"
        />
        {showLegend ? (
          <div className="flex flex-wrap gap-3" aria-hidden="true">
            {SENTIMENT_CATS.map((c) => (
              <div key={c.key} className="h-3 w-16 rounded bg-sunken animate-pulse" />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        className={cn('py-6', className)}
        title="No se pudo cargar"
        description="Hubo un problema al obtener la distribucion. Intenta de nuevo."
        onRetry={onRetry}
      />
    )
  }

  const total = counts ? sumCounts(counts) : 0
  if (!counts || total <= 0) {
    return (
      <EmptyState
        className={cn('py-6', className)}
        title="Sin datos"
        description="No hay menciones en el rango seleccionado."
      />
    )
  }

  const segments = SENTIMENT_CATS.map((cat) => {
    const value = counts[cat.key] ?? 0
    return { ...cat, value, pct: (value / total) * 100 }
  }).filter((s) => s.value > 0)

  const ariaSummary = segments
    .map((s) => `${s.label} ${fmtPct(s.pct, 0)}`)
    .join(', ')

  return (
    <div className={className}>
      <div
        className="flex w-full overflow-hidden rounded-md bg-sunken"
        style={{ height }}
        role="img"
        aria-label={`${ariaLabel}: ${ariaSummary}`}
      >
        {segments.map((s) => (
          <span
            key={s.key}
            className="h-full first:rounded-l-md last:rounded-r-md"
            style={{ width: `${s.pct.toFixed(2)}%`, background: s.color }}
            title={`${s.label}: ${fmtInt(s.value)} (${fmtPct(s.pct)})`}
            aria-hidden="true"
          />
        ))}
      </div>

      {showLegend ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {SENTIMENT_CATS.map((cat) => (
            <li
              key={cat.key}
              className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted"
            >
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ background: cat.color }}
                aria-hidden="true"
              />
              {cat.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
