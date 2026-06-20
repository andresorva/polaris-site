/**
 * CriticsTable - sortable table of "Top voces criticas" (mockup 08-voces).
 *
 * Presentational + self-stating: the consumer passes `authors` (raw TopAuthor
 * rows from useTopAuthors) plus the query status flags, and this component owns
 * the 4 honest states (loading / error / empty / data). Synthetic authors
 * (author 'MX' + google_trends-only rows) are excluded from the display.
 *
 * REGLA 79: ASCII-only in every visible string. No accents, no n-con-tilde.
 */

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { TopAuthor } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'
import { isSyntheticAuthor } from '../../lib/utils/synthetic'
import { PlatformChip } from './PlatformChip'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SkeletonTable } from '../states/LoadingSkeleton'

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export type CriticsSortKey = 'author' | 'count' | 'pct_negative'
type SortDir = 'asc' | 'desc'

function sortAuthors(
  authors: TopAuthor[],
  key: CriticsSortKey,
  dir: SortDir,
): TopAuthor[] {
  return [...authors].sort((a, b) => {
    if (key === 'author') {
      const av = a.author ?? ''
      const bv = b.author ?? ''
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    const av = key === 'count' ? a.count : a.pct_negative
    const bv = key === 'count' ? b.count : b.pct_negative
    return dir === 'asc' ? av - bv : bv - av
  })
}

// `pct_negative` arrives as 0..1 from the backend; normalize to 0..100 for the
// minibar + label (handles a future 0..100 backend without double-scaling).
function toPct(raw: number): number {
  const v = raw <= 1 ? raw * 100 : raw
  return Math.max(0, Math.min(100, v))
}

function initials(handle: string): string {
  return handle.replace(/[@.]/g, '').slice(0, 2).toUpperCase() || '??'
}

// Color ramp green -> red driven by % negative, via sentiment CSS vars.
function negColor(pct: number): string {
  return `color-mix(in srgb, var(--sent-negative) ${pct}%, var(--sent-positive))`
}

// ---------------------------------------------------------------------------
// Sort header button
// ---------------------------------------------------------------------------

function SortTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
}: {
  label: string
  sortKey: CriticsSortKey
  activeKey: CriticsSortKey
  dir: SortDir
  onSort: (k: CriticsSortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sortKey === activeKey
  return (
    <th className={cn('py-2 pr-3', align === 'right' ? 'text-right' : 'text-left')}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wide',
          'text-ink-muted hover:text-ink transition-colors',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        <span>{label}</span>
        {active ? (
          dir === 'asc' ? (
            <ArrowUp size={11} aria-hidden="true" />
          ) : (
            <ArrowDown size={11} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={11} aria-hidden="true" className="opacity-50" />
        )}
      </button>
    </th>
  )
}

// ---------------------------------------------------------------------------
// CriticsTable
// ---------------------------------------------------------------------------

export type CriticsTableProps = {
  authors: TopAuthor[] | undefined
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Max rows after sort (mockup shows top 12). */
  limit?: number
  className?: string
}

export function CriticsTable({
  authors,
  loading = false,
  error = false,
  onRetry,
  limit = 12,
  className,
}: CriticsTableProps) {
  const [sortKey, setSortKey] = useState<CriticsSortKey>('count')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const real = (authors ?? []).filter((a) => !isSyntheticAuthor(a))
    return sortAuthors(real, sortKey, sortDir).slice(0, limit)
  }, [authors, sortKey, sortDir, limit])

  function toggleSort(key: CriticsSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'author' ? 'asc' : 'desc')
    }
  }

  if (loading) return <SkeletonTable rows={8} className={className} />
  if (error)
    return (
      <ErrorState
        className={className}
        title="No se pudieron cargar las voces"
        description="Hubo un problema al traer los autores criticos. Intenta de nuevo."
        onRetry={onRetry}
      />
    )
  if (rows.length === 0)
    return (
      <EmptyState
        className={className}
        icon={<AlertTriangle size={48} strokeWidth={1.5} />}
        title="Sin voces criticas"
        description="Tras excluir cuentas sinteticas, no quedan autores en la ventana seleccionada."
      />
    )

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <SortTh
              label="Autor"
              sortKey="author"
              activeKey={sortKey}
              dir={sortDir}
              onSort={toggleSort}
            />
            <th className="py-2 pr-3 text-left">
              <span className="text-xs font-mono uppercase tracking-wide text-ink-muted">
                Plat.
              </span>
            </th>
            <SortTh
              label="Menc."
              sortKey="count"
              activeKey={sortKey}
              dir={sortDir}
              onSort={toggleSort}
              align="right"
            />
            <SortTh
              label="% negativo"
              sortKey="pct_negative"
              activeKey={sortKey}
              dir={sortDir}
              onSort={toggleSort}
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => {
            const pct = toPct(a.pct_negative)
            const platform = (a.platforms ?? [])[0]
            return (
              <tr
                key={`${a.author}-${i}`}
                className="border-b border-border last:border-b-0"
              >
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid place-items-center w-7 h-7 rounded-full bg-surface text-[10px] font-bold text-ink-muted shrink-0"
                      aria-hidden="true"
                    >
                      {initials(a.author ?? '')}
                    </span>
                    <span className="font-medium text-ink truncate max-w-[200px]">
                      {a.author}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  {platform ? (
                    <PlatformChip platform={platform} />
                  ) : (
                    <span className="text-xs text-ink-subtle">(sin)</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-sm text-ink tabular-nums">
                  {a.count}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 max-w-[90px] rounded-full bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: negColor(pct) }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-ink-muted tabular-nums w-9 shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default CriticsTable
