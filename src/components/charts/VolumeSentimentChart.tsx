import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../ui/Card'
import { SkeletonChart } from '../states/LoadingSkeleton'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'

/**
 * VolumeSentimentChart (mockup 04 - Vista General).
 * Barras de volumen de menciones + linea de sentimiento neto en eje secundario.
 * Componente presentacional puro: la pantalla provee data y los 4 estados.
 *
 * Colores via CSS vars: volumen = --polaris-primary, sentimiento = --warning.
 * Sin acentos en strings visibles (Regla 79).
 */

export type VolumeSentimentPoint = {
  /** Etiqueta del eje X ya formateada por la pantalla (ej "12 jun", "08:00"). */
  label: string
  /** Volumen de menciones del bucket. */
  volume: number
  /**
   * Sentimiento neto del bucket en escala -1 a 1. Si es null el punto se
   * dibuja con hueco (connectNulls=false) en lugar de fingir un cero.
   */
  sentiment: number | null
}

type Props = {
  data: VolumeSentimentPoint[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  height?: number
  className?: string
  ariaLabel?: string
  /** Etiquetas de leyenda configurables (default es-MX sin acentos). */
  volumeLabel?: string
  sentimentLabel?: string
}

const VOLUME_COLOR = 'var(--polaris-primary)'
const SENTIMENT_COLOR = 'var(--warning)'

const numberFmt = new Intl.NumberFormat('es-MX')

function formatVolume(v: number): string {
  return numberFmt.format(Math.round(v))
}

function formatSentiment(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

type TooltipPayloadItem = {
  dataKey?: string | number
  value?: number | string | null
  payload?: VolumeSentimentPoint
}

type TooltipInnerProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  volumeLabel: string
  sentimentLabel: string
}

function CustomTooltip({
  active,
  payload,
  label,
  volumeLabel,
  sentimentLabel,
}: TooltipInnerProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload
  if (!point) return null
  const sentColor =
    point.sentiment == null
      ? 'var(--sent-neutral)'
      : point.sentiment < 0
        ? 'var(--sent-negative)'
        : 'var(--sent-positive)'
  return (
    <div className="bg-surface-elevated border border-border rounded-md shadow-sm p-2 text-xs font-mono">
      <div className="text-ink-muted mb-1">{String(label)}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ background: VOLUME_COLOR }}
            aria-hidden="true"
          />
          <span className="text-ink">{volumeLabel}</span>
        </span>
        <span className="text-ink tabular-nums">
          {formatVolume(point.volume)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: SENTIMENT_COLOR }}
            aria-hidden="true"
          />
          <span className="text-ink">{sentimentLabel}</span>
        </span>
        <span className="tabular-nums" style={{ color: sentColor }}>
          {point.sentiment == null ? 's/d' : formatSentiment(point.sentiment)}
        </span>
      </div>
    </div>
  )
}

export function VolumeSentimentChart({
  data,
  isLoading,
  isError,
  onRetry,
  height = 300,
  className,
  ariaLabel,
  volumeLabel = 'Menciones',
  sentimentLabel = 'Sentimiento',
}: Props) {
  if (isLoading) {
    return <SkeletonChart className={className} />
  }
  if (isError) {
    return (
      <Card className={className}>
        <ErrorState
          title="No se pudo cargar el volumen"
          description="Hubo un problema al traer la serie de menciones. Intenta de nuevo."
          onRetry={onRetry}
        />
      </Card>
    )
  }
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <EmptyState
          title="Sin datos de volumen"
          description="Aun no hay menciones registradas para este periodo."
        />
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div
        style={{ height }}
        role="img"
        aria-label={
          ariaLabel ?? 'Grafico de volumen de menciones y sentimiento neto'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              stroke="var(--grid-line)"
              strokeOpacity={1}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--text-tertiary)',
              }}
              stroke="var(--border-subtle)"
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              yAxisId="volume"
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--text-tertiary)',
              }}
              stroke="var(--border-subtle)"
              tickLine={false}
              tickFormatter={formatVolume}
              width={44}
            />
            <YAxis
              yAxisId="sentiment"
              orientation="right"
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--text-tertiary)',
              }}
              stroke="var(--border-subtle)"
              tickLine={false}
              tickFormatter={(v: number) => v.toFixed(1)}
              width={40}
            />
            <ReferenceLine
              yAxisId="sentiment"
              y={0}
              stroke="var(--border-subtle)"
              strokeDasharray="2 3"
            />
            <Tooltip
              content={
                <CustomTooltip
                  volumeLabel={volumeLabel}
                  sentimentLabel={sentimentLabel}
                />
              }
              cursor={{ fill: 'var(--polaris-primary)', fillOpacity: 0.06 }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              name={volumeLabel}
              fill={VOLUME_COLOR}
              fillOpacity={0.85}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="sentiment"
              name={sentimentLabel}
              stroke={SENTIMENT_COLOR}
              strokeWidth={1.8}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default VolumeSentimentChart
