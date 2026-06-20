import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils/cn'

export type BadgeVariant =
  | 'default'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'mixed'
  | 'sarcastic'
  | 'unknown'
  | 'accent'

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  children: ReactNode
}

// Re-mapeado a tokens v3. sarcastic + unknown ahora existen (antes el token
// faltaba y sarcastic caia al gris fallback).
const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-card text-ink border border-border-subtle',
  positive:
    'bg-sentiment-positive/15 text-sentiment-positive border border-sentiment-positive/30',
  neutral:
    'bg-sentiment-neutral/15 text-sentiment-neutral border border-sentiment-neutral/30',
  negative:
    'bg-sentiment-negative/15 text-sentiment-negative border border-sentiment-negative/30',
  mixed: 'bg-sentiment-mixed/15 text-sentiment-mixed border border-sentiment-mixed/30',
  sarcastic:
    'bg-sentiment-sarcastic/15 text-sentiment-sarcastic border border-sentiment-sarcastic/30',
  unknown:
    'bg-sentiment-unknown/15 text-sentiment-unknown border border-sentiment-unknown/30',
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
