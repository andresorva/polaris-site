/**
 * Sentiment helpers — color tokens + localized labels.
 *
 * Color resolution goes through CSS custom properties so theming multi-tenant
 * works without code changes. Token names mirror what design-system declares
 * in `src/index.css` (`--polaris-sentiment-*`).
 */

import type { SentimentLabel } from '../api/types'

const DEFAULT_LOCALE = 'es-MX'

const COLOR_TOKEN: Record<SentimentLabel, string> = {
  positive: 'var(--polaris-sentiment-positive)',
  negative: 'var(--polaris-sentiment-negative)',
  neutral: 'var(--polaris-sentiment-neutral)',
  mixed: 'var(--polaris-sentiment-mixed)',
  sarcastic: 'var(--polaris-sentiment-sarcastic)',
}

const FALLBACK_COLOR = 'var(--polaris-sentiment-unknown, var(--text-2, #888))'

export function sentimentColor(label: SentimentLabel | null | undefined): string {
  if (!label) return FALLBACK_COLOR
  return COLOR_TOKEN[label] ?? FALLBACK_COLOR
}

const LABEL_ES_MX: Record<SentimentLabel, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
  mixed: 'Mixto',
  sarcastic: 'Sarcastico',
}

const LABEL_EN: Record<SentimentLabel, string> = {
  positive: 'Positive',
  negative: 'Negative',
  neutral: 'Neutral',
  mixed: 'Mixed',
  sarcastic: 'Sarcastic',
}

export function sentimentLabel(
  label: SentimentLabel | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!label) return locale.startsWith('es') ? 'Sin datos' : 'No data'
  const map = locale.startsWith('es') ? LABEL_ES_MX : LABEL_EN
  return map[label] ?? label
}
