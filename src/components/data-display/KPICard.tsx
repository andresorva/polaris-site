import { TrendingDown, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card } from '../ui/Card'
import { SkeletonKPI } from '../states/LoadingSkeleton'
import { cn } from '../../lib/utils/cn'

export type KPIFormat = 'number' | 'percent' | 'currency'

type Props = {
  label: string
  value: number | string
  delta?: { value: number; period: string }
  sparkline?: number[]
  format?: KPIFormat
  loading?: boolean
  className?: string
}

function formatValue(value: number | string, format: KPIFormat): string {
  if (typeof value === 'string') return value
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
      }).format(value)
    case 'number':
    default:
      return new Intl.NumberFormat('es-MX').format(value)
  }
}

export function KPICard({
  label,
  value,
  delta,
  sparkline,
  format = 'number',
  loading = false,
  className,
}: Props) {
  if (loading) {
    return <SkeletonKPI className={className} />
  }

  const deltaPositive = delta ? delta.value > 0 : false
  const deltaNegative = delta ? delta.value < 0 : false

  const sparkData = sparkline?.map((v, i) => ({ i, v })) ?? null

  return (
    <Card className={cn('flex flex-col gap-2', className)}>
      <div className="text-xs font-medium tracking-wide uppercase text-ink-muted">
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-3xl font-mono font-medium text-ink leading-none">
          {formatValue(value, format)}
        </div>
        {sparkData && sparkData.length > 1 ? (
          <div className="h-10 w-24 shrink-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--polaris-primary)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
      {delta ? (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-mono',
            deltaPositive && 'text-sentiment-positive',
            deltaNegative && 'text-sentiment-negative',
            !deltaPositive && !deltaNegative && 'text-ink-muted',
          )}
        >
          {deltaPositive ? (
            <TrendingUp size={14} strokeWidth={2} />
          ) : deltaNegative ? (
            <TrendingDown size={14} strokeWidth={2} />
          ) : null}
          <span>
            {delta.value > 0 ? '+' : ''}
            {delta.value.toFixed(1)}% {delta.period}
          </span>
        </div>
      ) : null}
    </Card>
  )
}
