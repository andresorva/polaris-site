import type { CSSProperties } from 'react'
import { cn } from '../../lib/utils/cn'

/**
 * Skeleton — primitivo reusable de carga (shimmer tintado del partido).
 *
 * Design v3 (01-design-system): "Loading usa shimmer tintado del partido (no
 * spinner)". El tinte sale de --bg-sunken / --bg-card (tokens de tenant que
 * define Wave 1), asi el shimmer hereda el color del partido sin hardcodear.
 * Sin keyframe custom (no tocamos tailwind.config.js): usamos animate-pulse.
 *
 * Regla 79: cero acentos. Cero data fake: solo bloques neutros de placeholder.
 */

export type SkeletonProps = {
  /** Ancho CSS (ej "40%", "8rem", 120). Default: 100%. */
  width?: number | string
  /** Alto CSS (ej "14px", "1rem", 14). Default: 1rem. */
  height?: number | string
  /** Forma del bloque. text/rect = radius chico, circle = pill. */
  variant?: 'text' | 'rect' | 'circle'
  className?: string
  style?: CSSProperties
}

function toDim(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined
  return typeof v === 'number' ? `${v}px` : v
}

/**
 * Bloque base de skeleton. Reusalo para componer cualquier placeholder.
 * aria-hidden: el contenedor padre (LoadingState) lleva el role=status.
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'rect',
  className,
  style,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-sunken',
        variant === 'circle'
          ? 'rounded-full'
          : variant === 'text'
            ? 'rounded-xs'
            : 'rounded-sm',
        className,
      )}
      style={{
        width: toDim(width),
        height: variant === 'circle' ? toDim(width) : toDim(height),
        ...style,
      }}
    />
  )
}

/**
 * Skeleton de texto: N lineas, la ultima mas corta (look honesto de parrafo).
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="0.875rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton de KPI card: label + valor grande + delta.
 * Espeja el layout v3 (height 14/28/32) del mockup design-system.
 */
export function SkeletonKPI({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-card p-4 flex flex-col gap-3',
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton height="14px" width="40%" />
      <Skeleton height="28px" width="70%" />
      <Skeleton height="12px" width="50%" />
    </div>
  )
}

/**
 * Skeleton de grafico: titulo + area de plot.
 */
export function SkeletonChart({
  className,
  height = 220,
}: {
  className?: string
  height?: number
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-card p-4 flex flex-col gap-3',
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton height="14px" width="35%" />
      <Skeleton height={height} width="100%" />
    </div>
  )
}

/**
 * Skeleton de tabla: header + N filas con celdas.
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-card overflow-hidden',
        className,
      )}
      aria-hidden="true"
    >
      <div className="border-b border-border-subtle p-3 flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="12px" width={`${Math.round(100 / cols)}%`} />
        ))}
      </div>
      <div className="flex flex-col gap-3 p-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                height="14px"
                width={c === 0 ? '24%' : c === cols - 1 ? '18%' : '30%'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Skeleton
