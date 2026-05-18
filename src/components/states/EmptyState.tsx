import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils/cn'

type Props = {
  title: string
  description: string
  cta?: { label: string; onClick: () => void }
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, cta, icon, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className,
      )}
    >
      <div className="text-ink-subtle mb-4" aria-hidden="true">
        {icon ?? <Inbox size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted max-w-md">{description}</p>
      {cta ? (
        <Button variant="primary" className="mt-4" onClick={cta.onClick}>
          {cta.label}
        </Button>
      ) : null}
    </div>
  )
}
