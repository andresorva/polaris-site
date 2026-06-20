/**
 * Shared sentiment palette + ASCII labels for the v3 charts.
 *
 * Colors come ONLY from the --sent-* CSS vars defined by Wave 1 (theme).
 * REGLA 79: every visible string here is plain ASCII (a e i o u n).
 *
 * Imported by ruta directa from the chart components (no barrel).
 */

export type SentimentBucketKey =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'mixed'
  | 'sarcastic'

export interface SentimentCat {
  key: SentimentBucketKey
  /** ASCII label for legends / tooltips. */
  label: string
  /** CSS var reference (var(--sent-*)). */
  color: string
}

/** Canonical order used across donut, bars and legends. */
export const SENTIMENT_CATS: readonly SentimentCat[] = [
  { key: 'positive', label: 'Positivo', color: 'var(--sent-positive)' },
  { key: 'negative', label: 'Negativo', color: 'var(--sent-negative)' },
  { key: 'neutral', label: 'Neutral', color: 'var(--sent-neutral)' },
  { key: 'mixed', label: 'Mixto', color: 'var(--sent-mixed)' },
  { key: 'sarcastic', label: 'Sarcastico', color: 'var(--sent-sarcastic)' },
]

export const SENTIMENT_COLOR: Record<SentimentBucketKey, string> = {
  positive: 'var(--sent-positive)',
  negative: 'var(--sent-negative)',
  neutral: 'var(--sent-neutral)',
  mixed: 'var(--sent-mixed)',
  sarcastic: 'var(--sent-sarcastic)',
}

export const SENTIMENT_LABEL: Record<SentimentBucketKey, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
  mixed: 'Mixto',
  sarcastic: 'Sarcastico',
}

/** Counts keyed by sentiment bucket (subset allowed). */
export type SentimentCounts = Partial<Record<SentimentBucketKey, number>>

/** Sum of a counts object (treats missing buckets as 0). */
export function sumCounts(counts: SentimentCounts): number {
  let total = 0
  for (const v of Object.values(counts)) {
    if (typeof v === 'number') total += v
  }
  return total
}

/** Format an integer with thousands separators (ASCII, en-US grouping). */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** Format a percentage value already in 0..100 with one decimal. */
export function fmtPct(pct: number, decimals = 1): string {
  return `${pct.toFixed(decimals)}%`
}
