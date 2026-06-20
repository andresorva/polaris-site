import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

// Re-mapeado a tokens v3: fondo sunken, borde sutil, focus glow de marca.
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
        'block w-full h-10 px-3 rounded-xs text-sm',
        'bg-sunken text-ink placeholder:text-ink-subtle',
        'border border-border-subtle',
        'transition-[border-color,box-shadow,background-color] duration-200 ease-out',
        'focus:outline-none focus:border-primary focus:bg-card',
        'focus:shadow-[0_0_0_4px_var(--primary-soft)]',
        'disabled:opacity-50 disabled:pointer-events-none',
        invalid &&
          'border-sentiment-negative focus:border-sentiment-negative focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--sent-negative)_22%,transparent)]',
        className,
      )}
      {...rest}
    />
  )
})
