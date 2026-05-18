import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../ui/Card'

export type SentimentKey = 'positive' | 'neutral' | 'negative' | 'mixed'

type Row = {
  label: string
  value: number
  sentiment?: SentimentKey
  color?: string
}

type Props = {
  data: Row[]
  height?: number
  className?: string
  ariaLabel?: string
}

const SENTIMENT_COLOR: Record<SentimentKey, string> = {
  positive: 'var(--polaris-sentiment-positive)',
  neutral: 'var(--polaris-sentiment-neutral)',
  negative: 'var(--polaris-sentiment-negative)',
  mixed: 'var(--polaris-sentiment-mixed)',
}

function rowColor(row: Row): string {
  if (row.color) return row.color
  if (row.sentiment) return SENTIMENT_COLOR[row.sentiment]
  return 'var(--polaris-primary)'
}

type TooltipPayloadItem = {
  value?: number
  payload?: Row
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  if (!item || !item.payload) return null
  return (
    <div className="bg-surface-elevated border border-border rounded-md shadow-sm p-2 text-xs font-mono">
      <div className="text-ink">{item.payload.label}</div>
      <div className="text-ink-muted tabular-nums">
        {Number(item.value ?? 0).toLocaleString('es-MX')}
      </div>
    </div>
  )
}

export function DistributionChart({
  data,
  height,
  className,
  ariaLabel,
}: Props) {
  const computedHeight = height ?? Math.max(140, data.length * 36 + 40)
  return (
    <Card className={className}>
      <div
        style={{ height: computedHeight }}
        role="img"
        aria-label={ariaLabel ?? 'Grafico de distribucion horizontal'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              stroke="var(--polaris-border)"
              strokeOpacity={0.4}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fill: 'var(--polaris-text-muted)',
              }}
              stroke="var(--polaris-border)"
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fill: 'var(--polaris-text)',
              }}
              stroke="var(--polaris-border)"
              tickLine={false}
              width={100}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--polaris-border)', fillOpacity: 0.2 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((row, i) => (
                <Cell key={i} fill={rowColor(row)} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 11,
                  fill: 'var(--polaris-text-muted)',
                }}
                formatter={(v: unknown) =>
                  Number(v ?? 0).toLocaleString('es-MX')
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
