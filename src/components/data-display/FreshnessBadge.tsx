/**
 * FreshnessBadge — pill que muestra que tan reciente es la ultima colecta.
 *
 * Mockup 04 (vista general): pildora con dot pulsante + "Actualizado hace <1h ·
 * fresh". El color sigue el status del backend:
 *   fresh   -> success (verde)   dot pulsa
 *   stale   -> warning (ambar)
 *   missing -> error   (rojo)
 *
 * Consume `useFreshness(politicianId)` -> 4 estados honestos:
 *   loading  -> pildora neutra "Verificando datos"
 *   error    -> pildora roja "Sin estado de datos"
 *   empty    -> sin status / sin colecta -> "Sin colecta · <status>"
 *   data     -> pildora coloreada con el texto relativo
 *
 * REGLA 79: ASCII puro en todo string visible.
 * El dot pulsa via @keyframes inline; se apaga con prefers-reduced-motion.
 */

import { Clock } from 'lucide-react'
import { useFreshness } from '../../lib/api/queries'
import type { Freshness, FreshnessStatus } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'

type StatusStyle = {
  /** Token de color semantico (sin alpha). */
  color: string
  /** Token de color de fondo suave. */
  soft: string
}

const STATUS_STYLE: Record<FreshnessStatus, StatusStyle> = {
  fresh: { color: 'var(--success)', soft: 'var(--success-soft)' },
  stale: { color: 'var(--warning)', soft: 'var(--warning-soft)' },
  missing: { color: 'var(--error)', soft: 'var(--error-soft)' },
}

const NEUTRAL_STYLE: StatusStyle = {
  color: 'var(--text-secondary)',
  soft: 'var(--bg-sunken)',
}

function hoursLabel(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return 'Sin colecta'
  if (hours < 1) return 'Actualizado hace <1h'
  const rounded = Math.round(hours)
  return `Actualizado hace ${rounded}h`
}

type ShellProps = {
  style: StatusStyle
  pulse: boolean
  children: React.ReactNode
  title?: string
  className?: string
}

/** Capa visual compartida por los 4 estados (misma pildora, distinto color). */
function BadgeShell({ style, pulse, children, title, className }: ShellProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-pill px-3 h-8 text-xs font-semibold',
        className,
      )}
      style={{ background: style.soft, color: style.color }}
      title={title}
    >
      <style>{`
        @keyframes polaris-fresh-pulse {
          0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          70%  { box-shadow: 0 0 0 5px transparent; opacity: 0.85; }
          100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .polaris-fresh-dot { animation: none !important; }
        }
      `}</style>
      <span
        className="polaris-fresh-dot inline-block h-2 w-2 rounded-full"
        style={{
          background: 'currentColor',
          animation: pulse ? 'polaris-fresh-pulse 2s var(--ease-out) infinite' : undefined,
        }}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}

type PresentationProps = {
  data: Freshness | undefined | null
  className?: string
}

/** Render puro a partir de un objeto Freshness (sin fetch). Reutilizable. */
export function FreshnessBadgeView({ data, className }: PresentationProps) {
  if (!data) {
    return (
      <BadgeShell style={NEUTRAL_STYLE} pulse={false} className={className}>
        <Clock size={12} aria-hidden="true" />
        Sin estado de datos
      </BadgeShell>
    )
  }
  const status = data.status
  const style = STATUS_STYLE[status] ?? NEUTRAL_STYLE
  const label = `${hoursLabel(data.hours_since_collection)} · ${status}`
  return (
    <BadgeShell
      style={style}
      pulse={status === 'fresh'}
      title={label}
      className={className}
    >
      {label}
    </BadgeShell>
  )
}

type Props = {
  politicianId: string
  className?: string
}

/**
 * FreshnessBadge conectado: hace fetch via useFreshness y resuelve los 4
 * estados. Usalo en headers de pagina (vista general, etc).
 */
export function FreshnessBadge({ politicianId, className }: Props) {
  const { data, isLoading, isError } = useFreshness(politicianId)

  if (isLoading) {
    return (
      <BadgeShell style={NEUTRAL_STYLE} pulse={false} className={className}>
        <Clock size={12} aria-hidden="true" />
        Verificando datos
      </BadgeShell>
    )
  }

  if (isError) {
    return (
      <BadgeShell style={STATUS_STYLE.missing} pulse={false} className={className}>
        <Clock size={12} aria-hidden="true" />
        Sin estado de datos
      </BadgeShell>
    )
  }

  return <FreshnessBadgeView data={data} className={className} />
}
