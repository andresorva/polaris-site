import { Monitor, Moon, Sun } from 'lucide-react'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import type { ThemeMode } from '../../features/client-theme/themeContext'
import { cn } from '../../lib/utils/cn'

type Option = {
  value: ThemeMode
  label: string
  Icon: typeof Sun
}

const OPTIONS: Option[] = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
]

type Props = {
  className?: string
}

/**
 * Toggle light/dark/system. Persiste via ThemeProvider.
 */
export function ThemeToggle({ className }: Props) {
  const { mode, setMode } = useClientTheme()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-elevated p-0.5',
        className,
      )}
      role="group"
      aria-label="Tema"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              'inline-flex items-center justify-center h-7 w-7 rounded-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'bg-primary text-white'
                : 'text-ink-muted hover:bg-[var(--polaris-border)] hover:text-ink',
            )}
          >
            <Icon size={14} strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}
