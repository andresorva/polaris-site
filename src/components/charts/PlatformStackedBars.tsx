/**
 * PlatformStackedBars - mockup 06 "Distribucion por plataforma" panel.
 *
 * One stacked sentiment bar per platform (platform name + total menciones on
 * top, colored track below) plus an inline sentiment legend at the bottom.
 * Pure CSS, reuses SentimentBar for each track. Four honest states. Colors
 * from --sent-* (Wave 1). REGLA 79: ASCII only.
 *
 * Import by ruta directa:
 *   import { PlatformStackedBars } from '../charts/PlatformStackedBars'
 */

import { Card } from '../ui/Card'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SentimentBar } from './SentimentBar'
import {
  SENTIMENT_CATS,
  fmtInt,
  sumCounts,
  type SentimentCounts,
} from './sentimentColors'

/** One platform row: a display name + its sentiment counts. */
export interface PlatformSentimentRow {
  /** ASCII display label (e.g. "Twitter", "Bluesky", "News MX"). */
  platform: string
  counts: SentimentCounts
}

type Props = {
  rows?: PlatformSentimentRow[] | null
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Panel title. */
  title?: string
  /** Small hint at top-right (e.g. "% de menciones"). */
  hint?: string
  /** Number of skeleton rows to show while loading. */
  loadingRows?: number
  className?: string
}

function PanelHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {hint ? <span className="text-[11px] text-ink-subtle">{hint}</span> : null}
    </div>
  )
}

function InlineLegend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
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
  )
}

export function PlatformStackedBars({
  rows,
  loading = false,
  error = false,
  onRetry,
  title = 'Distribucion por plataforma',
  hint = '% de menciones',
  loadingRows = 4,
  className,
}: Props) {
  if (loading) {
    return (
      <Card className={className}>
        <PanelHead title={title} hint={hint} />
        <div
          className="flex flex-col gap-4"
          role="status"
          aria-label="Cargando distribucion por plataforma"
        >
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={i} className="space-y-2" aria-hidden="true">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-sunken animate-pulse" />
                <div className="h-3 w-14 rounded bg-sunken animate-pulse" />
              </div>
              <div className="h-3.5 w-full rounded-md bg-sunken animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <PanelHead title={title} hint={hint} />
        <ErrorState
          title="No se pudo cargar"
          description="Hubo un problema al obtener la distribucion por plataforma. Intenta de nuevo."
          onRetry={onRetry}
        />
      </Card>
    )
  }

  const visibleRows = (rows ?? []).filter((r) => sumCounts(r.counts) > 0)
  if (visibleRows.length === 0) {
    return (
      <Card className={className}>
        <PanelHead title={title} hint={hint} />
        <EmptyState
          title="Sin menciones"
          description="No hay menciones por plataforma en el rango seleccionado."
        />
      </Card>
    )
  }

  return (
    <Card className={className}>
      <PanelHead title={title} hint={hint} />

      <div className="flex flex-col gap-4">
        {visibleRows.map((row) => {
          const total = sumCounts(row.counts)
          return (
            <div key={row.platform}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <b className="font-semibold text-ink">{row.platform}</b>
                <span className="font-mono text-[11px] text-ink-subtle tabular-nums">
                  {fmtInt(total)} menc.
                </span>
              </div>
              <SentimentBar
                counts={row.counts}
                height={14}
                ariaLabel={`Sentimiento en ${row.platform}`}
              />
            </div>
          )
        })}
      </div>

      <InlineLegend />
    </Card>
  )
}
