import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react'
import { Sparkline, type SparkTone } from './Sparkline'
import { cn } from '../../lib/utils/cn'

// KPICard v3 (mockup 04-vista-general): valor grande mono + label arriba,
// delta con direccion up/down/flat, mini sparkline y nota revelada en hover.
// Hover lift (translateY + sombra + ring). 4 estados honestos.

export type KPIFormat = 'number' | 'percent' | 'currency' | 'score'
export type KPIDirection = 'up' | 'down' | 'flat'

export type KPIDelta = {
  // Magnitud del cambio (negativo = baja). Se usa el signo para la direccion
  // por defecto si no se pasa `direction`.
  value: number
  // Etiqueta de periodo opcional, ej. "30d". Sin acentos (regla 79).
  period?: string
  // Fuerza una direccion (util cuando "bajar" es bueno, ej. menciones neg).
  direction?: KPIDirection
}

type BaseProps = {
  label: string
  className?: string
  // Nota que aparece bajo el card al hacer hover (mockup: .reveal).
  note?: string
}

type DataProps = BaseProps & {
  value: number | string
  // Unidad corta a la derecha del valor (ej. "%"), estilo .val .u del mockup.
  unit?: string
  delta?: KPIDelta
  sparkline?: number[]
  format?: KPIFormat
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

function formatValue(value: number | string, format: KPIFormat): string {
  if (typeof value === 'string') return value
  switch (format) {
    case 'percent':
      return value.toFixed(1)
    case 'score':
      return value.toFixed(2)
    case 'currency':
      // Locale neutro: separador de miles sin simbolo dependiente de acentos.
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(value)
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

function resolveDirection(delta: KPIDelta): KPIDirection {
  if (delta.direction) return delta.direction
  if (delta.value > 0) return 'up'
  if (delta.value < 0) return 'down'
  return 'flat'
}

const cardShell =
  'group relative flex flex-col gap-3 rounded-md border bg-card p-4 shadow-soft'

// --- Estado: loading (skeleton inline, mismo layout) ---
function KPILoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(cardShell, 'border-border-subtle', className)}
      role="status"
      aria-label="Cargando indicador"
    >
      <div className="flex items-center justify-between">
        <span className="h-2.5 w-20 animate-pulse rounded bg-surface-elevated" />
        <span className="h-2.5 w-10 animate-pulse rounded bg-surface-elevated" />
      </div>
      <span className="h-7 w-24 animate-pulse rounded bg-surface-elevated" />
      <span className="h-[30px] w-full animate-pulse rounded bg-surface-elevated" />
    </div>
  )
}

// --- Estado: error ---
function KPIError({
  label,
  onRetry,
  className,
}: {
  label: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        cardShell,
        'border-border-subtle justify-between',
        className,
      )}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          {label}
        </span>
        <AlertTriangle
          size={14}
          strokeWidth={2}
          className="text-sentiment-negative"
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-ink-muted">No se pudo cargar.</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

export function KPICard({
  label,
  value,
  unit,
  delta,
  sparkline,
  note,
  format = 'number',
  loading = false,
  error = false,
  onRetry,
  className,
}: DataProps) {
  if (loading) {
    return <KPILoading className={className} />
  }

  if (error) {
    return <KPIError label={label} onRetry={onRetry} className={className} />
  }

  // --- Estado: empty (sin valor disponible) ---
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === 'number' && Number.isNaN(value)) ||
    value === ''

  const dir: KPIDirection | null = delta ? resolveDirection(delta) : null
  const sparkTone: SparkTone =
    dir === 'up' ? 'positive' : dir === 'down' ? 'negative' : 'primary'

  return (
    <div
      className={cn(
        cardShell,
        'cursor-default border-border-subtle transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-medium',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          {label}
        </span>
        {delta && dir ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold tabular-nums',
              dir === 'up' && 'text-success',
              dir === 'down' && 'text-error',
              dir === 'flat' && 'text-ink-subtle',
            )}
          >
            {dir === 'up' ? (
              <TrendingUp size={12} strokeWidth={2.5} aria-hidden="true" />
            ) : dir === 'down' ? (
              <TrendingDown size={12} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Minus size={12} strokeWidth={2.5} aria-hidden="true" />
            )}
            <span>
              {delta.value > 0 ? '+' : ''}
              {delta.value.toFixed(1)}%
              {delta.period ? ` ${delta.period}` : ''}
            </span>
          </span>
        ) : null}
      </div>

      {isEmpty ? (
        <span className="font-mono text-2xl font-semibold leading-none text-ink-subtle">
          --
        </span>
      ) : (
        <span className="font-mono text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink">
          {formatValue(value as number | string, format)}
          {unit ? (
            <span className="ml-0.5 text-[15px] text-ink-subtle">{unit}</span>
          ) : null}
        </span>
      )}

      {!isEmpty && sparkline && sparkline.length >= 2 ? (
        <Sparkline data={sparkline} tone={sparkTone} height={30} />
      ) : (
        <span className="h-[30px]" aria-hidden="true" />
      )}

      {note ? (
        <span className="text-[11px] font-semibold text-primary opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          {note}
        </span>
      ) : null}
    </div>
  )
}
