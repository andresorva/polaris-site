import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/utils/cn'
import { Button } from '../ui/Button'
import { PlatformChip } from './PlatformChip'
import { MentionDetailModal } from './MentionDetailModal'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SkeletonTable } from '../states/LoadingSkeleton'
import type { Mention } from '../../lib/api/types'

/**
 * MentionsDataTable — sortable + paginated table specialized for Mention rows
 * (mockup 11-fuentes). Plain React (no table dependency): client-side sort and
 * pagination over the rows passed in. Caller fetches; this stays presentation.
 *
 * Features:
 * - Sortable columns (timestamp / author / platform / sentiment / engagement).
 * - Density toggle (compact / normal / comfortable) like the mockup.
 * - Row click opens MentionDetailModal (9 agentes) — internal by default, or
 *   delegate via `onRowClick`.
 * - Responsive: <table> on >= md, card list on mobile.
 * - 4 honest states (loading / empty / error / data).
 *
 * REGLA 79: every visible string is ASCII. Sentiment color resolves via the
 * CSS var --sent-* family (positive/negative/neutral/mixed/sarcastic).
 */

type SortDir = 'asc' | 'desc'
type SortKey =
  | 'collected_at'
  | 'author'
  | 'platform'
  | 'sentiment'
  | 'topic'
  | 'engagement'
type Density = 'compact' | 'normal' | 'comfortable'

type Props = {
  data: Mention[]
  /** True while the first page is loading (shows skeleton). */
  isLoading?: boolean
  /** True when the fetch errored (shows ErrorState). */
  isError?: boolean
  /** Retry handler wired to ErrorState. */
  onRetry?: () => void
  pageSize?: number
  initialSortKey?: SortKey
  initialSortDir?: SortDir
  initialDensity?: Density
  /**
   * Row click handler. When omitted, the table renders MentionDetailModal
   * internally and opens it with the clicked row's id.
   */
  onRowClick?: (mention: Mention) => void
  /** Hide the density toggle (e.g. embedded in a tighter layout). */
  hideDensity?: boolean
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

// ---------------------------------------------------------------------------
// ASCII-only helpers (local — never edits shared utils)
// ---------------------------------------------------------------------------

function engagementSum(m: Mention): number {
  const metrics = m.engagement_metrics
  if (!metrics || typeof metrics !== 'object') return 0
  let sum = 0
  for (const v of Object.values(metrics)) {
    if (typeof v === 'number' && Number.isFinite(v)) sum += v
  }
  return sum
}

function fmtEngagement(n: number): string {
  if (n <= 0) return '-'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function fmtScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return 'n/d'
  const v = Number(score)
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

/** Tone bucket for the score pill, mirroring the mockup thresholds. */
function scoreTone(
  score: number | null | undefined,
): 'positive' | 'negative' | 'neutral' | 'unknown' {
  if (score === null || score === undefined || Number.isNaN(score)) return 'unknown'
  if (score <= -0.2) return 'negative'
  if (score >= 0.2) return 'positive'
  return 'neutral'
}

/** Plain ASCII `YYYY-MM-DD HH:MM` (no locale month names => no accents). */
function fmtTimestamp(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function truncate(text: string | null | undefined, n: number): string {
  if (!text) return ''
  if (text.length <= n) return text
  return text.slice(0, n).trimEnd() + '...'
}

function primaryTopic(m: Mention): string {
  const t = m.topic_categories?.[0]
  return t ? t.replace(/_/g, ' ') : '-'
}

function authorLabel(m: Mention): string {
  return m.author ?? m.author_handle ?? '-'
}

// Accessor per sort key — drives client-side sort.
function sortValue(m: Mention, key: SortKey): string | number {
  switch (key) {
    case 'collected_at':
      return new Date(m.collected_at).getTime() || 0
    case 'author':
      return authorLabel(m).toLowerCase()
    case 'platform':
      return m.platform
    case 'sentiment':
      return m.sentiment_score ?? -Infinity
    case 'topic':
      return primaryTopic(m).toLowerCase()
    case 'engagement':
      return engagementSum(m)
    default:
      return 0
  }
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

// Density => row padding classes.
const DENSITY_PAD: Record<Density, string> = {
  compact: 'py-1.5',
  normal: 'py-3',
  comfortable: 'py-[18px]',
}

const COLUMNS: { key: SortKey | 'content'; label: string; sortable: boolean; align?: 'right' }[] = [
  { key: 'collected_at', label: 'Timestamp', sortable: true },
  { key: 'author', label: 'Autor', sortable: true },
  { key: 'platform', label: 'Plat.', sortable: true },
  { key: 'sentiment', label: 'Sent.', sortable: true },
  { key: 'topic', label: 'Topic', sortable: true },
  { key: 'content', label: 'Texto', sortable: false },
  { key: 'engagement', label: 'Eng.', sortable: true, align: 'right' },
]

// ---------------------------------------------------------------------------
// Score pill
// ---------------------------------------------------------------------------

function ScorePill({ score }: { score: number | null | undefined }) {
  const tone = scoreTone(score)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
        tone === 'positive' && 'bg-sentiment-positive/15 text-sentiment-positive',
        tone === 'negative' && 'bg-sentiment-negative/15 text-sentiment-negative',
        tone === 'neutral' && 'bg-sentiment-neutral/15 text-sentiment-neutral',
        tone === 'unknown' && 'bg-surface-elevated text-ink-subtle',
      )}
    >
      {fmtScore(score)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export function MentionsDataTable({
  data,
  isLoading = false,
  isError = false,
  onRetry,
  pageSize = 20,
  initialSortKey = 'collected_at',
  initialSortDir = 'desc',
  initialDensity = 'normal',
  onRowClick,
  hideDensity = false,
  emptyTitle = 'Sin menciones',
  emptyDescription = 'No hay menciones para los filtros actuales.',
  className,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>(initialSortKey)
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir)
  const [density, setDensity] = useState<Density>(initialDensity)
  const [page, setPage] = useState(0)
  // Internal modal state — only used when onRowClick is not provided.
  const [openId, setOpenId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...data].sort(
      (a, b) => compare(sortValue(a, sortKey), sortValue(b, sortKey)) * dir,
    )
  }, [data, sortKey, sortDir])

  // Reset page when the result set or sort changes.
  const resetKey = `${sortKey}|${sortDir}|${data.length}`
  const [lastResetKey, setLastResetKey] = useState(resetKey)
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey)
    if (page !== 0) setPage(0)
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const start = currentPage * pageSize
  const pageRows = sorted.slice(start, start + pageSize)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function handleRow(m: Mention) {
    if (onRowClick) onRowClick(m)
    else setOpenId(m.id)
  }

  // ----- 4 honest states -----
  if (isLoading) {
    return <SkeletonTable rows={8} className={className} />
  }
  if (isError) {
    return (
      <ErrorState
        title="No pudimos cargar las menciones"
        description="El endpoint /mentions respondio con error. Reintenta."
        onRetry={onRetry}
        className={className}
      />
    )
  }
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    )
  }

  const pad = DENSITY_PAD[density]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar: count + density */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs font-mono text-ink-muted tabular-nums">
          Mostrando{' '}
          <span className="text-ink">
            {start + 1}-{Math.min(start + pageSize, sorted.length)}
          </span>{' '}
          de <span className="text-ink">{sorted.length}</span> menciones
        </div>
        {hideDensity ? null : (
          <div
            className="inline-flex items-center gap-0.5 rounded-md border border-border-subtle bg-sunken p-0.5"
            role="group"
            aria-label="Densidad de la tabla"
          >
            {(['compact', 'normal', 'comfortable'] as Density[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                aria-pressed={density === d}
                className={cn(
                  'rounded px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-colors',
                  density === d
                    ? 'bg-card text-primary shadow-soft'
                    : 'text-ink-subtle hover:text-ink',
                )}
              >
                {d === 'compact'
                  ? 'Compacto'
                  : d === 'normal'
                    ? 'Normal'
                    : 'Comodo'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile card list (<md) */}
      <div className="md:hidden space-y-2">
        {pageRows.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleRow(m)}
            className="w-full text-left rounded-md border border-border-subtle bg-card p-3 space-y-2 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-ink truncate">
                {authorLabel(m)}
              </span>
              <ScorePill score={m.sentiment_score} />
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-ink-subtle">
              <PlatformChip platform={m.platform} />
              <span>{fmtTimestamp(m.collected_at)}</span>
            </div>
            <p className="text-sm text-ink-muted leading-snug">
              {truncate(m.content, 160)}
            </p>
          </button>
        ))}
      </div>

      {/* Desktop table (>= md) */}
      <div className="hidden md:block rounded-md border border-border-subtle bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-sunken border-b border-border-subtle">
                {COLUMNS.map((col) => {
                  const isActive = col.sortable && sortKey === col.key
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn(
                        'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle whitespace-nowrap',
                        col.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key as SortKey)}
                          className={cn(
                            'inline-flex items-center gap-1 hover:text-ink transition-colors uppercase',
                            isActive && 'text-ink',
                          )}
                          aria-sort={
                            isActive
                              ? sortDir === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                        >
                          <span>{col.label}</span>
                          {isActive ? (
                            sortDir === 'asc' ? (
                              <ChevronUp size={11} aria-hidden="true" />
                            ) : (
                              <ChevronDown size={11} aria-hidden="true" />
                            )
                          ) : (
                            <ChevronsUpDown
                              size={11}
                              className="opacity-50"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => handleRow(m)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleRow(m)
                    }
                  }}
                  className="border-b border-border-subtle last:border-b-0 cursor-pointer hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] focus:outline-none transition-colors"
                >
                  <td className={cn('px-3 align-middle', pad)}>
                    <span className="font-mono text-[11px] text-ink-subtle whitespace-nowrap">
                      {fmtTimestamp(m.collected_at)}
                    </span>
                  </td>
                  <td className={cn('px-3 align-middle', pad)}>
                    <span className="font-semibold text-ink whitespace-nowrap">
                      {authorLabel(m)}
                    </span>
                  </td>
                  <td className={cn('px-3 align-middle', pad)}>
                    <PlatformChip platform={m.platform} />
                  </td>
                  <td className={cn('px-3 align-middle', pad)}>
                    <ScorePill score={m.sentiment_score} />
                  </td>
                  <td className={cn('px-3 align-middle', pad)}>
                    <span className="inline-flex items-center rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-ink-muted whitespace-nowrap">
                      {primaryTopic(m)}
                    </span>
                  </td>
                  <td className={cn('px-3 align-middle', pad)}>
                    <div className="max-w-[360px] truncate text-ink-muted">
                      {truncate(m.content, 200)}
                    </div>
                  </td>
                  <td className={cn('px-3 align-middle text-right', pad)}>
                    <span className="font-mono text-xs tabular-nums text-ink-muted">
                      {fmtEngagement(engagementSum(m))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs font-mono text-ink-subtle tabular-nums">
            {pageSize} por pagina
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              aria-label="Pagina anterior"
            >
              Anterior
            </Button>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Pagina siguiente"
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      {/* Internal modal (only when caller did not hijack row clicks) */}
      {onRowClick ? null : (
        <MentionDetailModal mentionId={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  )
}

export default MentionsDataTable
