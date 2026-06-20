import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
 * SentimentEvolution (mockup 06 - Sentimiento).
 * Evolucion del sentimiento como 5 series apiladas: positivo, negativo,
 * neutral, mixto, sarcastico. Componente presentacional puro.
 *
 * Colores via CSS vars --sent-positive/-negative/-neutral/-mixed/-sarcastic.
 * Sin acentos en strings visibles (Regla 79).
 */

export type SentimentEvolutionPoint = {
  /** Etiqueta del eje X ya formateada por la pantalla (ej "12 jun"). */
  label: string
  positive: number
  negative: number
  neutral: number
  mixed: number
  sarcastic: number
}

type SeriesKey = keyof Omit<SentimentEvolutionPoint, 'label'>

type SeriesDef = {
  key: SeriesKey
  label: string
  color: string
}

// Orden de apilado de abajo hacia arriba (negativo abajo para resaltar).
const SERIES: SeriesDef[] = [
  { key: 'negative', label: 'Negativo', color: 'var(--sent-negative)' },
  { key: 'positive', label: 'Positivo', color: 'var(--sent-positive)' },
  { key: 'neutral', label: 'Neutral', color: 'var(--sent-neutral)' },
  { key: 'mixed', label: 'Mixto', color: 'var(--sent-mixed)' },
  { key: 'sarcastic', label: 'Sarcastico', color: 'var(--sent-sarcastic)' },
]

const LABEL_BY_KEY: Record<SeriesKey, string> = {
  negative: 'Negativo',
  positive: 'Positivo',
  neutral: 'Neutral',
  mixed: 'Mixto',
  sarcastic: 'Sarcastico',
}

type Props = {
  data: SentimentEvolutionPoint[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  height?: number
  className?: string
  ariaLabel?: string
  /**
   * 'percent' apila a 100% (composicion relativa, default mockup 06).
   * 'number' apila conteos absolutos.
   */
  format?: 'percent' | 'number'
}

const numberFmt = new Intl.NumberFormat('es-MX')

function formatValue(v: number, format: 'percent' | 'number'): string {
  if (format === 'percent') return `${v.toFixed(1)}%`
  return numberFmt.format(Math.round(v))
}

type TooltipPayloadItem = {
  dataKey?: string | number
  value?: number | string | null
  color?: string
}

type TooltipInnerProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  format: 'percent' | 'number'
}

function CustomTooltip({ active, payload, label, format }: TooltipInnerProps) {
  if (!active || !payload || payload.length === 0) return null
  // Mostrar de arriba hacia abajo para que coincida con el apilado visual.
  const items = [...payload].reverse()
  return (
    <div className="bg-surface-elevated border border-border rounded-md shadow-sm p-2 text-xs font-mono">
      <div className="text-ink-muted mb-1">{String(label)}</div>
      {items.map((p, i) => {
        const key = p.dataKey as SeriesKey | undefined
        const name = key ? LABEL_BY_KEY[key] : String(p.dataKey ?? '')
        return (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: p.color }}
                aria-hidden="true"
              />
              <span className="text-ink">{name}</span>
            </span>
            <span className="text-ink tabular-nums">
              {typeof p.value === 'number'
                ? formatValue(p.value, format)
                : '0'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function SentimentEvolution({
  data,
  isLoading,
  isError,
  onRetry,
  height = 300,
  className,
  ariaLabel,
  format = 'percent',
}: Props) {
  if (isLoading) {
    return <SkeletonChart className={className} />
  }
  if (isError) {
    return (
      <Card className={className}>
        <ErrorState
          title="No se pudo cargar la evolucion"
          description="Hubo un problema al traer la serie de sentimiento. Intenta de nuevo."
          onRetry={onRetry}
        />
      </Card>
    )
  }
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <EmptyState
          title="Sin datos de sentimiento"
          description="Aun no hay menciones clasificadas para este periodo."
        />
      </Card>
    )
  }

  const stackOffset = format === 'percent' ? 'expand' : 'none'

  return (
    <Card className={className}>
      <div
        style={{ height }}
        role="img"
        aria-label={ariaLabel ?? 'Grafico de evolucion del sentimiento apilado'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            stackOffset={stackOffset}
            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
          >
            <defs>
              {SERIES.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`sent-evo-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.25} />
                </linearGradient>
              ))}
            </defs>
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
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--text-tertiary)',
              }}
              stroke="var(--border-subtle)"
              tickLine={false}
              width={44}
              domain={format === 'percent' ? [0, 1] : undefined}
              tickFormatter={(v: number) =>
                format === 'percent'
                  ? `${Math.round(v * 100)}%`
                  : numberFmt.format(v)
              }
            />
            <Tooltip
              content={<CustomTooltip format={format} />}
              cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
              formatter={(value) => {
                const key = value as SeriesKey
                return LABEL_BY_KEY[key] ?? String(value)
              }}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.key}
                stackId="sentiment"
                stroke={s.color}
                strokeWidth={s.key === 'negative' ? 2 : 1.4}
                fill={`url(#sent-evo-${s.key})`}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default SentimentEvolution
