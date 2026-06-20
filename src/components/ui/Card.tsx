import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

// Re-mapeado a tokens v3: superficie de card + borde sutil + radio md + sombra soft.
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, padded = true, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border-subtle rounded-md shadow-soft',
        padded && 'p-5',
        className,
      )}
      {...rest}
    />
  )
})
