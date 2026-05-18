import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, padded = true, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface-elevated border border-border rounded-lg',
        padded && 'p-4',
        className,
      )}
      {...rest}
    />
  )
})
