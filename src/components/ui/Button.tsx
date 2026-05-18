import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary',
  secondary:
    'bg-surface-elevated text-ink border border-border hover:bg-[var(--polaris-border)] focus-visible:ring-primary',
  ghost:
    'bg-transparent text-ink hover:bg-surface-elevated focus-visible:ring-primary',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...rest}
      />
    )
  },
)
