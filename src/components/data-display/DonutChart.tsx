import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '../ui/Card'

type Slice = { name: string; value: number; color?: string }

type Props = {
  data: Slice[]
  height?: number
  centerLabel?: string
  centerValue?: string | number
  className?: string
  ariaLabel?: string
}

const DEFAULT_COLORS = [
  'var(--polaris-primary)',
  'var(--polaris-accent)',
  'var(--polaris-sentiment-positive)',
  'var(--polaris-sentiment-negative)',
  'var(--polaris-sentiment-mixed)',
  'var(--polaris-primary-light)',
]

type TooltipPayloadItem = {
  payload?: Slice & { total?: number }
  value?: number
  name?: string | number
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  total: number
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  if (!item) return null
  const v = typeof item.value === 'number' ? item.value : 0
  const pct = total > 0 ? (v / total) * 100 : 0
  return (
    <div className="bg-surface-elevated border border-border rounded-md shadow-sm p-2 text-xs font-mono">
      <div className="text-ink">{String(item.name ?? item.payload?.name)}</div>
      <div className="text-ink-muted tabular-nums">
        {v.toLocaleString('es-MX')} ({pct.toFixed(1)}%)
      </div>
    </div>
  )
}

export function DonutChart({
  data,
  height = 280,
  centerLabel,
  centerValue,
  className,
  ariaLabel,
}: Props) {
  const total = data.reduce((acc, s) => acc + s.value, 0)
  const computedCenterValue =
    centerValue ?? total.toLocaleString('es-MX')

  return (
    <Card className={className}>
      <div
        style={{ height }}
        role="img"
        aria-label={ariaLabel ?? 'Grafico de distribucion'}
        className="relative"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="var(--polaris-bg)"
              strokeWidth={2}
              isAnimationActive={false}
              label={({ name, percent }) => {
                const pct = ((percent ?? 0) * 100).toFixed(0)
                return `${name} ${pct}%`
              }}
              labelLine={false}
            >
              {data.map((s, i) => (
                <Cell
                  key={s.name}
                  fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-mono font-medium text-ink leading-none">
            {computedCenterValue}
          </div>
          {centerLabel ? (
            <div className="text-[10px] uppercase tracking-wide text-ink-muted mt-1">
              {centerLabel}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
