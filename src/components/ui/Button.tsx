import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Estado loading: muestra spinner y deshabilita la interaccion. */
  loading?: boolean
}

// Variantes re-mapeadas a tokens v3 (primary = color de marca,
// secondary/ghost sobre neutrales slate). Hover usa --bg-hover via clase card/sunken.
const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-[color:var(--text-on-primary)] hover:bg-primary-dark focus-visible:ring-primary shadow-soft',
  secondary:
    'bg-card text-ink border border-border-subtle hover:border-border-strong hover:bg-[var(--bg-hover)] focus-visible:ring-primary',
  ghost:
    'bg-transparent text-ink hover:bg-[var(--bg-hover)] focus-visible:ring-primary',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      type = 'button',
      children,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-xs font-medium',
          'transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...rest}
      >
        {loading && (
          <span className="absolute inset-0 inline-flex items-center justify-center">
            <Spinner />
          </span>
        )}
        <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
          {children}
        </span>
      </button>
    )
  },
)
