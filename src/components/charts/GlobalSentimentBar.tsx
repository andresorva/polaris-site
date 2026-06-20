/**
 * GlobalSentimentBar - mockup 06 "Sentimiento global" panel.
 *
 * Big "negativo neto" stat + a single stacked track + a detailed legend
 * (swatch / nombre / conteo / porcentaje per bucket). Reuses SentimentBar for
 * the track. Four honest states. Colors from --sent-* (Wave 1). REGLA 79:
 * ASCII only.
 *
 * Import by ruta directa:
 *   import { GlobalSentimentBar } from '../charts/GlobalSentimentBar'
 */

import { Card } from '../ui/Card'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SentimentBar } from './SentimentBar'
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
  /** Panel title. */
  title?: string
  /** Small hint at the top-right (e.g. "30d"). */
  hint?: string
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

export function GlobalSentimentBar({
  counts,
  loading = false,
  error = false,
  onRetry,
  title = 'Sentimiento global',
  hint,
  className,
}: Props) {
  if (loading) {
    return (
      <Card className={className}>
        <PanelHead title={title} hint={hint} />
        <div role="status" aria-label="Cargando sentimiento global" className="space-y-4">
          <div className="h-9 w-40 rounded bg-sunken animate-pulse" aria-hidden="true" />
          <div className="h-[18px] w-full rounded-md bg-sunken animate-pulse" aria-hidden="true" />
          <div className="space-y-2.5" aria-hidden="true">
            {SENTIMENT_CATS.map((c) => (
              <div key={c.key} className="h-3 w-full rounded bg-sunken animate-pulse" />
            ))}
          </div>
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
          description="Hubo un problema al obtener el sentimiento global. Intenta de nuevo."
          onRetry={onRetry}
        />
      </Card>
    )
  }

  const total = counts ? sumCounts(counts) : 0
  if (!counts || total <= 0) {
    return (
      <Card className={className}>
        <PanelHead title={title} hint={hint} />
        <EmptyState
          title="Sin menciones"
          description="No hay menciones en el rango seleccionado para calcular el sentimiento global."
        />
      </Card>
    )
  }

  const negValue = counts.negative ?? 0
  const negPct = (negValue / total) * 100

  return (
    <Card className={className}>
      <PanelHead title={title} hint={hint} />

      <div className="mb-3.5 flex items-baseline gap-2.5">
        <b
          className="font-mono text-[38px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
          style={{ color: 'var(--sent-negative)' }}
        >
          {fmtPct(negPct, 0)}
        </b>
        <span className="text-sm text-ink-muted">negativo neto</span>
      </div>

      <SentimentBar counts={counts} height={18} ariaLabel="Sentimiento global" />

      <ul className="mt-4 flex flex-col gap-2.5">
        {SENTIMENT_CATS.map((cat) => {
          const value = counts[cat.key] ?? 0
          const pct = (value / total) * 100
          return (
            <li key={cat.key} className="flex items-center gap-2.5 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-[3px] shrink-0"
                style={{ background: cat.color }}
                aria-hidden="true"
              />
              <span className="text-ink-muted">{cat.label}</span>
              <span className="ml-auto font-mono font-semibold text-ink tabular-nums">
                {fmtInt(value)}
              </span>
              <span className="w-12 text-right font-mono text-[11px] text-ink-subtle tabular-nums">
                {fmtPct(pct)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
