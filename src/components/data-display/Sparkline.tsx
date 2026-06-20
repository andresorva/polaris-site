import { useId } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts'
import { cn } from '../../lib/utils/cn'

// Tono del trazo. Mapeado a CSS vars de sentimiento (las define Wave 1)
// + primary como tono neutral por defecto. Cero color hardcodeado.
export type SparkTone = 'primary' | 'positive' | 'negative' | 'neutral'

const TONE_VAR: Record<SparkTone, string> = {
  primary: 'var(--polaris-primary)',
  positive: 'var(--sent-positive)',
  negative: 'var(--sent-negative)',
  neutral: 'var(--sent-neutral)',
}

export type SparklineProps = {
  // Serie de valores en orden cronologico (viejo -> nuevo).
  data: number[]
  tone?: SparkTone
  // Relleno tenue bajo la curva (estilo area). Por defecto solo linea.
  fill?: boolean
  strokeWidth?: number
  height?: number
  width?: number | `${number}%`
  className?: string
}

type Point = { i: number; v: number }

// Sparkline puro: sin ejes, sin tooltip, decorativo (aria-hidden).
// Acepta serie vacia o de un punto sin romper (devuelve null).
export function Sparkline({
  data,
  tone = 'primary',
  fill = false,
  strokeWidth = 1.5,
  height = 30,
  width = '100%',
  className,
}: SparklineProps) {
  const gradientId = useId()

  if (!Array.isArray(data) || data.length < 2) {
    return null
  }

  const points: Point[] = data.map((v, i) => ({ i, v }))
  const color = TONE_VAR[tone]

  return (
    <div
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <ResponsiveContainer width={width} height="100%">
        {fill ? (
          <AreaChart
            data={points}
            margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart
            data={points}
            margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
          >
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
