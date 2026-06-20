import { cn } from '../../lib/utils/cn'
import { useDemoBadgeFlag } from './demoBadgeFlag'

type Props = {
  label?: string
  className?: string
  /**
   * Ignora el flag global y siempre renderiza (showcase de componentes /dev).
   * Las pantallas NO deben usar esto: el chip se quita desde un solo lugar
   * (env VITE_DEMO_BADGE o toggle de Settings) via useDemoBadgeFlag.
   */
  always?: boolean
}

/**
 * Chip "DEMO" removible para marcar paneles con data sintetica.
 * Anti-pattern guard contra F-9 / F-11 (data falsa sin disclosure).
 *
 * Removible desde UN solo lugar: el flag global (useDemoBadgeFlag), alimentado
 * por VITE_DEMO_BADGE o el toggle de Settings. Cuando se apaga, este componente
 * devuelve null -> desaparece en toda la app sin tocar las pantallas que lo
 * montan. Regla 79: texto sin acentos.
 */
export function DemoBadge({ label = 'DEMO', className, always = false }: Props) {
  const enabled = useDemoBadgeFlag((s) => s.enabled)
  if (!always && !enabled) return null

  return (
    <span
      className={cn('demo-badge', className)}
      role="status"
      aria-label="Datos de demostracion"
      title="Datos de demostracion (sinteticos)"
    >
      {label}
    </span>
  )
}

export default DemoBadge
