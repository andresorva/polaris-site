import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils/cn'

export type BadgeVariant =
  | 'default'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'mixed'
  | 'accent'

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-ink border border-border',
  positive: 'bg-sentiment-positive/15 text-sentiment-positive border border-sentiment-positive/30',
  neutral: 'bg-sentiment-neutral/15 text-sentiment-neutral border border-sentiment-neutral/30',
  negative: 'bg-sentiment-negative/15 text-sentiment-negative border border-sentiment-negative/30',
  mixed: 'bg-sentiment-mixed/15 text-sentiment-mixed border border-sentiment-mixed/30',
  accent: 'bg-accent/15 text-accent border border-accent/30',
}

export function Badge({
  variant = 'default',
  className,
  children,
  ...rest
}: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium font-mono',
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
