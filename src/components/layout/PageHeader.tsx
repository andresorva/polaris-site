import type { ReactNode } from 'react'
import { cn } from '../../lib/utils/cn'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: Props) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink truncate">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
