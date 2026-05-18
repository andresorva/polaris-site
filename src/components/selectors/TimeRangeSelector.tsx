import { useState } from 'react'
import { cn } from '../../lib/utils/cn'

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all'

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1a' },
  { value: 'all', label: 'Todo' },
]

type Props = {
  value?: TimeRange
  defaultValue?: TimeRange
  onChange?: (value: TimeRange) => void
  className?: string
}

/**
 * Selector de rango temporal. Visual-only por ahora (Fase 2).
 * Fase 3+ lo conecta a Zustand store global.
 */
export function TimeRangeSelector({
  value,
  defaultValue = '30d',
  onChange,
  className,
}: Props) {
  const [internal, setInternal] = useState<TimeRange>(defaultValue)
  const current = value ?? internal

  function handleChange(next: TimeRange) {
    if (value === undefined) {
      setInternal(next)
    }
    onChange?.(next)
  }

  return (
    <label className={cn('inline-block', className)}>
      <span className="sr-only">Rango temporal</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value as TimeRange)}
        className="font-mono text-sm bg-surface-elevated text-ink border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Seleccionar rango temporal"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
