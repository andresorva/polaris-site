import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full h-10 px-3 rounded-md text-sm',
        'bg-surface-elevated text-ink placeholder:text-ink-subtle',
        'border border-border',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
        'disabled:opacity-50 disabled:pointer-events-none',
        invalid &&
          'border-sentiment-negative focus:ring-sentiment-negative focus:border-sentiment-negative',
        className,
      )}
      {...rest}
    />
  )
})
