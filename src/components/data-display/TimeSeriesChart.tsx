import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../ui/Card'

type SeriesDef = { key: string; label: string; color?: string }
type Row = { date: string; [series: string]: number | string }

type Props = {
  data: Row[]
  series: SeriesDef[]
  height?: number
  format?: 'number' | 'percent'
  className?: string
  ariaLabel?: string
}

const DEFAULT_COLORS = [
  'var(--polaris-primary)',
  'var(--polaris-accent)',
  'var(--polaris-sentiment-positive)',
  'var(--polaris-sentiment-negative)',
  'var(--polaris-sentiment-mixed)',
]

function formatNumber(v: number, format: 'number' | 'percent'): string {
  if (format === 'percent') return `${v.toFixed(1)}%`
  return new Intl.NumberFormat('es-MX').format(v)
}

type TooltipPayloadItem = {
  color?: string
  name?: string | number
  dataKey?: string | number
  value?: number | string
  payload?: Row
}

type TooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  format: 'number' | 'percent'
}

function CustomTooltip({ active, payload, label, format }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-surface-elevated border border-border rounded-md shadow-sm p-2 text-xs font-mono">
      <div className="text-ink-muted mb-1">{String(label)}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: p.color }}
              aria-hidden="true"
            />
            <span className="text-ink">{String(p.name ?? p.dataKey)}</span>
          </span>
          <span className="text-ink tabular-nums">
            {typeof p.value === 'number'
              ? formatNumber(p.value, format)
              : String(p.value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TimeSeriesChart({
  data,
  series,
  height = 300,
  format = 'number',
  className,
  ariaLabel,
}: Props) {
  return (
    <Card className={className}>
      <div
        style={{ height }}
        role="img"
        aria-label={ariaLabel ?? 'Grafico de serie temporal'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              stroke="var(--polaris-border)"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--polaris-text-muted)',
              }}
              stroke="var(--polaris-border)"
              tickLine={false}
            />
            <YAxis
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--polaris-text-muted)',
              }}
              stroke="var(--polaris-border)"
              tickLine={false}
              tickFormatter={(v: number) => formatNumber(v, format)}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip format={format} />}
              cursor={{ stroke: 'var(--polaris-border)', strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: 'var(--polaris-text-muted)',
              }}
              iconType="line"
            />
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
