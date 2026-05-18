import { cn } from '../../lib/utils/cn'

type SkeletonProps = {
  className?: string
}

function Block({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-elevated rounded-md',
        className,
      )}
      aria-hidden="true"
    />
  )
}

export function SkeletonKPI({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'p-4 border border-border rounded-lg bg-surface space-y-3',
        className,
      )}
      role="status"
      aria-label="Cargando KPI"
    >
      <Block className="h-3 w-24" />
      <Block className="h-8 w-32" />
      <Block className="h-3 w-16" />
    </div>
  )
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'p-4 border border-border rounded-lg bg-surface space-y-3',
        className,
      )}
      role="status"
      aria-label="Cargando grafico"
    >
      <Block className="h-3 w-32" />
      <Block className="h-48 w-full" />
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  className,
}: SkeletonProps & { rows?: number }) {
  return (
    <div
      className={cn(
        'border border-border rounded-lg bg-surface overflow-hidden',
        className,
      )}
      role="status"
      aria-label="Cargando tabla"
    >
      <div className="p-3 border-b border-border">
        <Block className="h-3 w-32" />
      </div>
      <div className="p-3 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Block className="h-3 w-1/4" />
            <Block className="h-3 w-1/3" />
            <Block className="h-3 w-1/5" />
            <Block className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
