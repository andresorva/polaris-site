/**
 * AlertBanner — pildora/banner de conteo de alertas activas.
 *
 * Mockup 04 + 09: en el header muestra "N alertas activas" con una campana que
 * hace bell-shake cuando hay una alerta critica activa. Respeta
 * prefers-reduced-motion (la campana se queda quieta).
 *
 * Dos modos:
 *   - count  (default): pildora compacta para el page-head. Color segun la peor
 *              severidad activa (critical -> error, resto -> warning).
 *   - inline : banner ancho con la peor alerta destacada (para la cima de una
 *              pagina), con link/CTA opcional a la vista de alertas.
 *
 * Consume `useAlerts(politicianId)`. 4 estados honestos:
 *   loading -> pildora neutra "Cargando alertas"
 *   error   -> pildora roja "Alertas no disponibles"
 *   empty   -> pildora verde "Sin alertas activas" (estado saludable, no oculto)
 *   data    -> conteo + bell-shake si hay critica
 *
 * REGLA 79: ASCII puro en todo string visible.
 */

import { Bell, TriangleAlert } from 'lucide-react'
import { useAlerts } from '../../lib/api/queries'
import type { Alert, AlertSeverity } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'

const BELL_KEYFRAMES = `
  @keyframes polaris-bell-shake {
    0%, 92%, 100% { transform: rotate(0); }
    94% { transform: rotate(12deg); }
    96% { transform: rotate(-10deg); }
    98% { transform: rotate(6deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .polaris-bell { animation: none !important; }
  }
`

function severityRank(s: AlertSeverity | string): number {
  switch (s) {
    case 'critical':
      return 4
    case 'warning':
      return 3
    case 'watch':
      return 2
    case 'info':
      return 1
    default:
      return 0
  }
}

type Tone = {
  color: string
  soft: string
}

const TONE_CRITICAL: Tone = { color: 'var(--error)', soft: 'var(--error-soft)' }
const TONE_WARNING: Tone = { color: 'var(--warning)', soft: 'var(--warning-soft)' }
const TONE_OK: Tone = { color: 'var(--success)', soft: 'var(--success-soft)' }
const TONE_NEUTRAL: Tone = {
  color: 'var(--text-secondary)',
  soft: 'var(--bg-sunken)',
}

function activeAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter((a) => !a.is_resolved)
}

function pluralAlertas(n: number): string {
  return n === 1 ? '1 alerta activa' : `${n} alertas activas`
}

// ---------------------------------------------------------------------------
// Pildora compacta (modo count)
// ---------------------------------------------------------------------------

function Pill({
  tone,
  shake,
  children,
  className,
}: {
  tone: Tone
  shake: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 h-9 px-4 rounded-pill text-sm font-semibold',
        className,
      )}
      style={{ background: tone.soft, color: tone.color }}
    >
      <style>{BELL_KEYFRAMES}</style>
      <Bell
        size={16}
        aria-hidden="true"
        className={cn('polaris-bell origin-top', shake && 'shake-on')}
        style={
          shake
            ? { animation: 'polaris-bell-shake 2.4s var(--ease-in-out) infinite' }
            : undefined
        }
      />
      {children}
    </span>
  )
}

type Props = {
  politicianId: string
  /** count = pildora; inline = banner ancho con la peor alerta. */
  variant?: 'count' | 'inline'
  /** Oculta del todo cuando no hay alertas activas (solo modo inline). */
  hideWhenEmpty?: boolean
  /** CTA opcional (modo inline): p.ej. navegar a /crisis. */
  onView?: () => void
  className?: string
}

export function AlertBanner({
  politicianId,
  variant = 'count',
  hideWhenEmpty = false,
  onView,
  className,
}: Props) {
  const { data, isLoading, isError } = useAlerts(politicianId)

  // ---- Estados loading / error (mismos en ambos modos) ----
  if (isLoading) {
    return (
      <Pill tone={TONE_NEUTRAL} shake={false} className={className}>
        Cargando alertas
      </Pill>
    )
  }
  if (isError) {
    return (
      <Pill tone={TONE_CRITICAL} shake={false} className={className}>
        Alertas no disponibles
      </Pill>
    )
  }

  const active = activeAlerts(data ?? [])
  const count = active.length
  const worst = active.reduce<Alert | null>(
    (acc, a) =>
      acc === null || severityRank(a.severity) > severityRank(acc.severity)
        ? a
        : acc,
    null,
  )
  const hasCritical = worst?.severity === 'critical'
  const tone = hasCritical ? TONE_CRITICAL : count > 0 ? TONE_WARNING : TONE_OK

  // ---- Empty (sin alertas activas) ----
  if (count === 0) {
    if (variant === 'inline' && hideWhenEmpty) return null
    return (
      <Pill tone={TONE_OK} shake={false} className={className}>
        Sin alertas activas
      </Pill>
    )
  }

  // ---- Modo count: pildora con conteo ----
  if (variant === 'count') {
    return (
      <Pill tone={tone} shake={hasCritical} className={className}>
        {pluralAlertas(count)}
      </Pill>
    )
  }

  // ---- Modo inline: banner ancho destacando la peor alerta ----
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3.5 rounded-md border px-4 py-4',
        className,
      )}
      style={{
        background: tone.soft,
        borderColor: `color-mix(in srgb, ${tone.color} 28%, transparent)`,
      }}
    >
      <style>{BELL_KEYFRAMES}</style>
      <span
        className="grid place-items-center h-9 w-9 shrink-0 rounded-[11px]"
        style={{
          background: `color-mix(in srgb, ${tone.color} 20%, transparent)`,
          color: tone.color,
        }}
        aria-hidden="true"
      >
        {hasCritical ? (
          <TriangleAlert size={18} />
        ) : (
          <Bell
            size={18}
            className="polaris-bell origin-top"
            style={
              hasCritical
                ? {
                    animation:
                      'polaris-bell-shake 2.4s var(--ease-in-out) infinite',
                  }
                : undefined
            }
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-sm font-semibold"
          style={{ color: tone.color }}
        >
          {pluralAlertas(count)}
        </div>
        {worst ? (
          <div className="text-sm text-ink-muted mt-0.5 truncate">
            {worst.title}
          </div>
        ) : null}
      </div>
      {onView ? (
        <button
          type="button"
          onClick={onView}
          className="shrink-0 text-sm font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs px-1"
          style={{ color: tone.color }}
        >
          Ver alertas
        </button>
      ) : null}
    </div>
  )
}
