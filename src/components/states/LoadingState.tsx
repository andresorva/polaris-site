import {
  Skeleton,
  SkeletonChart,
  SkeletonKPI,
  SkeletonTable,
  SkeletonText,
} from './Skeleton'
import { cn } from '../../lib/utils/cn'

/**
 * LoadingState — estado de carga honesto y reusable.
 *
 * Design v3 (01-design-system): shimmer tintado del partido, NO spinner. Por
 * eso el default es un set de bloques skeleton, no un loader giratorio. La
 * variante elige el layout placeholder segun lo que va a aparecer (kpi, chart,
 * table, text, block) para que el cambio loading -> data no salte.
 *
 * Lleva role=status + aria-busy para lectores de pantalla; los bloques internos
 * son aria-hidden. label se anuncia (sr-only) sin pintar texto visible de mas.
 *
 * Regla 79: cero acentos en strings visibles ni en aria.
 */

export type LoadingVariant = 'block' | 'kpi' | 'chart' | 'table' | 'text'

export type LoadingStateProps = {
  /** Forma del placeholder. Default: block. */
  variant?: LoadingVariant
  /** Cuantas piezas repetir (kpi/text rows segun variante). Default 1 (text=3). */
  count?: number
  /** Etiqueta accesible (sr-only). Default: "Cargando". */
  label?: string
  className?: string
}

export function LoadingState({
  variant = 'block',
  count,
  label = 'Cargando',
  className,
}: LoadingStateProps) {
  const n = count ?? (variant === 'kpi' ? 4 : variant === 'text' ? 3 : 1)

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn('w-full', className)}
    >
      <span className="sr-only">{label}</span>
      {variant === 'kpi' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: n }).map((_, i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
      ) : variant === 'chart' ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: n }).map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </div>
      ) : variant === 'table' ? (
        <SkeletonTable rows={count ?? 6} />
      ) : variant === 'text' ? (
        <SkeletonText lines={n} />
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from({ length: n }).map((_, i) => (
            <Skeleton key={i} height="2.5rem" />
          ))}
        </div>
      )}
    </div>
  )
}

export default LoadingState
