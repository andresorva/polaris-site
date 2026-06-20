/**
 * DefendersList - "Top defensores" panel (mockup 08-voces).
 *
 * Defensores = authors whose mentions skew pro-cliente. The backend now returns
 * `avg_sentiment_score` per author (TopAuthorWithScore), so we rank by that
 * descending and keep only positively-scored voices. If the score is missing
 * (older backend), we fall back to lowest pct_negative and surface a note so the
 * heuristic is honest rather than implied as ground truth.
 *
 * Presentational + self-stating: owns the 4 honest states
 * (loading / error / empty / data). Synthetic authors are excluded.
 *
 * REGLA 79: ASCII-only in every visible string.
 */

import { useMemo } from 'react'
import { Heart } from 'lucide-react'
import type { TopAuthorWithScore } from '../../lib/api/extended-types'
import { PlatformChip } from './PlatformChip'
import { isSyntheticAuthor } from '../../lib/utils/synthetic'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SkeletonTable } from '../states/LoadingSkeleton'

function initials(handle: string): string {
  return handle.replace(/[@.]/g, '').slice(0, 2).toUpperCase() || '??'
}

function hasScore(a: TopAuthorWithScore): a is TopAuthorWithScore & {
  avg_sentiment_score: number
} {
  return typeof a.avg_sentiment_score === 'number'
}

// pct_negative is 0..1 from backend.
function pctNeg(a: TopAuthorWithScore): number {
  const v = a.pct_negative <= 1 ? a.pct_negative : a.pct_negative / 100
  return Math.max(0, Math.min(1, v))
}

type Ranked = {
  list: TopAuthorWithScore[]
  /** true when ranking used avg_sentiment_score, false when heuristic fallback. */
  scored: boolean
}

function rankDefenders(
  authors: TopAuthorWithScore[],
  limit: number,
): Ranked {
  const real = authors.filter((a) => !isSyntheticAuthor(a) && a.count > 0)
  const scoredRows = real.filter(hasScore)

  // Prefer the real signal: positive avg sentiment, ranked high -> low.
  if (scoredRows.length > 0) {
    const positives = scoredRows
      .filter((a) => a.avg_sentiment_score > 0)
      .sort((a, b) => b.avg_sentiment_score - a.avg_sentiment_score)
    if (positives.length > 0) {
      return { list: positives.slice(0, limit), scored: true }
    }
  }

  // Fallback: least-negative voices (honest heuristic, flagged in UI).
  const fallback = [...real]
    .sort((a, b) => pctNeg(a) - pctNeg(b))
    .slice(0, limit)
  return { list: fallback, scored: false }
}

export type DefendersListProps = {
  authors: TopAuthorWithScore[] | undefined
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  limit?: number
  className?: string
}

export function DefendersList({
  authors,
  loading = false,
  error = false,
  onRetry,
  limit = 4,
  className,
}: DefendersListProps) {
  const { list, scored } = useMemo(
    () => rankDefenders(authors ?? [], limit),
    [authors, limit],
  )

  if (loading) return <SkeletonTable rows={4} className={className} />
  if (error)
    return (
      <ErrorState
        className={className}
        title="No se pudieron cargar los defensores"
        description="Hubo un problema al traer las voces a favor. Intenta de nuevo."
        onRetry={onRetry}
      />
    )
  if (list.length === 0)
    return (
      <EmptyState
        className={className}
        icon={<Heart size={48} strokeWidth={1.5} />}
        title="Sin defensores"
        description="No hay voces con saldo positivo hacia el cliente en la ventana actual."
      />
    )

  return (
    <div className={className}>
      {!scored ? (
        <p className="text-[11px] text-ink-muted italic mb-2">
          Heuristica: sin avg_sentiment_score, ordenado por menor % negativo.
        </p>
      ) : null}
      <ul>
        {list.map((d, i) => {
          const platform = (d.platforms ?? [])[0]
          const score = hasScore(d) ? d.avg_sentiment_score : null
          return (
            <li
              key={`${d.author}-${i}`}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
            >
              <span
                className="grid place-items-center w-7 h-7 rounded-full bg-surface text-[10px] font-bold text-ink-muted shrink-0"
                aria-hidden="true"
              >
                {initials(d.author ?? '')}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink truncate">
                  {d.author}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  {platform ? (
                    <PlatformChip platform={platform} className="text-[9px]" />
                  ) : null}
                  <span>{d.count} menciones</span>
                </span>
              </div>
              {score !== null ? (
                <span
                  className="font-mono text-sm font-semibold tabular-nums shrink-0"
                  style={{ color: 'var(--sent-positive)' }}
                >
                  {score >= 0 ? '+' : ''}
                  {score.toFixed(2)}
                </span>
              ) : (
                <span
                  className="font-mono text-xs tabular-nums shrink-0"
                  style={{ color: 'var(--sent-positive)' }}
                  title="porcentaje negativo (heuristica)"
                >
                  {(pctNeg(d) * 100).toFixed(0)}% neg
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default DefendersList
