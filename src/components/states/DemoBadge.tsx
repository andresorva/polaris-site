import { cn } from '../../lib/utils/cn'

type Props = {
  label?: string
  className?: string
}

/**
 * Prominent badge to mark sections rendered with mock/demo data.
 * Anti-pattern guard against F-9 / F-11 (false data without disclosure).
 */
export function DemoBadge({ label = 'DEMO', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase',
        'bg-yellow-400 text-yellow-950 border border-yellow-500',
        className,
      )}
      role="status"
      aria-label="Datos de demostracion"
    >
      {label}
    </span>
  )
}
