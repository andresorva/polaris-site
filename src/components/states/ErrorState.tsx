import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils/cn'

type Props = {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  icon?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Algo salio mal',
  description = 'No pudimos cargar los datos. Intenta de nuevo.',
  onRetry,
  retryLabel = 'Reintentar',
  icon,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className,
      )}
    >
      <div className="text-sentiment-negative mb-4" aria-hidden="true">
        {icon ?? <AlertTriangle size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted max-w-md">{description}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
