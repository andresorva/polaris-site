import { useMemo, useState } from 'react'
import { Download, ExternalLink, Info, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonTable } from '../../components/states/LoadingSkeleton'
import { DataTable, type Column } from '../../components/data-display/DataTable'
import { PlatformChip } from '../../components/data-display/PlatformChip'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { useMentions } from '../../lib/api/queries'
import type { Mention, SentimentLabel } from '../../lib/api/types'
import { formatNumber, formatRelativeTime } from '../../lib/utils/format'
import { platformLabel } from '../../lib/utils/platform'
import { sentimentLabel } from '../../lib/utils/sentiment'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE_BACKEND = 500 // backend hard cap; 422 if > 500
const MAX_PAGES = 4

type DateRange = '7d' | '30d' | '90d' | 'all'
type SentimentFilter = 'all' | SentimentLabel | 'null'
type SortKey = 'collected_at' | 'engagement' | 'sentiment_score'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '90d', label: 'Ultimos 90 dias' },
  { value: 'all', label: 'Todo' },
]

const SENTIMENT_OPTIONS: { value: SentimentFilter; label: string }[] = [
  { value: 'all', label: 'Todos los sentimientos' },
  { value: 'positive', label: 'Positivo' },
  { value: 'negative', label: 'Negativo' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'mixed', label: 'Mixto' },
  { value: 'sarcastic', label: 'Sarcastico' },
  { value: 'null', label: 'Sin clasificar' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'collected_at', label: 'Mas recientes' },
  { value: 'engagement', label: 'Mayor engagement' },
  { value: 'sentiment_score', label: 'Sentiment score' },
]

// ---------------------------------------------------------------------------
// Helpers
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

function truncate(text: string | null | undefined, n: number): string {
  if (!text) return ''
  if (text.length <= n) return text
  return text.slice(0, n).trimEnd() + '…'
}

function sentimentBadgeVariant(
  label: SentimentLabel | null,
): 'positive' | 'negative' | 'neutral' | 'mixed' | 'accent' | 'default' {
  switch (label) {
    case 'positive':
      return 'positive'
    case 'negative':
      return 'negative'
    case 'neutral':
      return 'neutral'
    case 'mixed':
      return 'mixed'
    case 'sarcastic':
      return 'accent'
    default:
      return 'default'
  }
}

function daysToCutoffDate(range: DateRange): Date | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function csvEscape(s: string): string {
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function exportMentionsCsv(rows: Mention[]) {
  const headers = [
    'id',
    'platform',
    'author',
    'author_handle',
    'title',
    'content',
    'sentiment_label',
    'sentiment_score',
    'engagement_sum',
    'collected_at',
    'published_at',
    'url',
    'is_own_content',
    'language',
  ]
  const lines = [headers.join(',')]
  for (const m of rows) {
    const row = [
      m.id,
      m.platform,
      m.author ?? '',
      m.author_handle ?? '',
      m.title ?? '',
      m.content ?? '',
      m.sentiment_label ?? '',
      m.sentiment_score === null || m.sentiment_score === undefined
        ? ''
        : String(m.sentiment_score),
      String(engagementSum(m)),
      m.collected_at,
      m.published_at ?? '',
      m.url,
      String(m.is_own_content),
      m.language ?? '',
    ]
    lines.push(row.map((v) => csvEscape(String(v))).join(','))
  }
  const csv = lines.join('\n')
  // Prepend BOM so Excel detects UTF-8.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mentions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Fuentes page
// ---------------------------------------------------------------------------

export function Fuentes() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  // Multi-call paginated fetch: we accumulate `pages` x 500.
  const [loadedPages, setLoadedPages] = useState(1)

  // Trigger one useQuery per page (each with a distinct offset). Hooks are
  // called unconditionally and in fixed order; we gate the actual fetch via
  // the `enabled: !!politicianId` flag baked into useMentions — passing an
  // empty politicianId disables that page's query.
  const q0 = useMentions(politicianId, {
    limit: PAGE_SIZE_BACKEND,
    offset: 0,
  })
  const q1 = useMentions(loadedPages >= 2 ? politicianId : '', {
    limit: PAGE_SIZE_BACKEND,
    offset: PAGE_SIZE_BACKEND,
  })
  const q2 = useMentions(loadedPages >= 3 ? politicianId : '', {
    limit: PAGE_SIZE_BACKEND,
    offset: PAGE_SIZE_BACKEND * 2,
  })
  const q3 = useMentions(loadedPages >= 4 ? politicianId : '', {
    limit: PAGE_SIZE_BACKEND,
    offset: PAGE_SIZE_BACKEND * 3,
  })
  const pageQueries = [q0, q1, q2, q3]
  const activeQueries = pageQueries.slice(0, loadedPages)

  const isInitialLoading = q0.isLoading
  const isFetchingMore = activeQueries.some((q, i) => i > 0 && q.isFetching)
  const queryError = activeQueries.find((q) => q.isError)

  const allMentions: Mention[] = useMemo(() => {
    const out: Mention[] = []
    for (const q of activeQueries) {
      if (q.data) out.push(...q.data)
    }
    // Dedupe by id (defensive — same offset twice shouldn't happen but safer).
    const seen = new Set<string>()
    return out.filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    q0.data,
    q1.data,
    q2.data,
    q3.data,
    loadedPages,
  ])

  // ---------- Filters state ----------
  const [search, setSearch] = useState('')
  const [excludeGoogleTrends, setExcludeGoogleTrends] = useState(true)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  )
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [sortKey, setSortKey] = useState<SortKey>('collected_at')

  // Available platforms in loaded data (sorted alphabetically).
  const availablePlatforms = useMemo(() => {
    const s = new Set<string>()
    for (const m of allMentions) s.add(m.platform)
    return Array.from(s).sort()
  }, [allMentions])

  // ---------- Apply filters ----------
  const filtered = useMemo(() => {
    const cutoff = daysToCutoffDate(dateRange)
    const needle = search.trim().toLowerCase()

    let out = allMentions.filter((m) => {
      // google_trends exclusion (overridden if user explicitly selects it)
      if (
        excludeGoogleTrends &&
        m.platform === 'google_trends' &&
        !selectedPlatforms.has('google_trends')
      ) {
        return false
      }
      // platform selection — empty set = all (modulo gtrends rule above)
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(m.platform)) {
        return false
      }
      // sentiment
      if (sentimentFilter !== 'all') {
        if (sentimentFilter === 'null') {
          if (m.sentiment_label !== null && m.sentiment_label !== undefined)
            return false
        } else if (m.sentiment_label !== sentimentFilter) {
          return false
        }
      }
      // date range
      if (cutoff) {
        const d = new Date(m.collected_at)
        if (Number.isNaN(d.getTime()) || d < cutoff) return false
      }
      // search full-text
      if (needle) {
        const hay = [
          m.content,
          m.author ?? '',
          m.author_handle ?? '',
          m.title ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })

    // sort
    out = [...out].sort((a, b) => {
      switch (sortKey) {
        case 'engagement':
          return engagementSum(b) - engagementSum(a)
        case 'sentiment_score': {
          const sa = a.sentiment_score ?? -Infinity
          const sb = b.sentiment_score ?? -Infinity
          return sb - sa
        }
        case 'collected_at':
        default: {
          const ta = new Date(a.collected_at).getTime()
          const tb = new Date(b.collected_at).getTime()
          return tb - ta
        }
      }
    })

    return out
  }, [
    allMentions,
    search,
    excludeGoogleTrends,
    selectedPlatforms,
    sentimentFilter,
    dateRange,
    sortKey,
  ])

  // ---------- Columns ----------
  const columns: Column<Mention>[] = useMemo(
    () => [
      {
        key: 'platform',
        label: 'Plataforma',
        width: '140px',
        sortable: true,
        sortAccessor: (m) => m.platform,
        mobileLabel: 'Plataforma',
        render: (m) => <PlatformChip platform={m.platform} />,
      },
      {
        key: 'author',
        label: 'Autor',
        width: '160px',
        sortable: true,
        sortAccessor: (m) => m.author ?? m.author_handle ?? '',
        render: (m) => (
          <div className="font-mono text-xs text-ink-muted truncate max-w-[180px]">
            {m.author ?? m.author_handle ?? '—'}
          </div>
        ),
      },
      {
        key: 'content',
        label: 'Contenido',
        sortable: false,
        render: (m) => (
          <div className="text-sm text-ink leading-snug">
            {m.title ? (
              <div className="font-semibold mb-0.5">{truncate(m.title, 120)}</div>
            ) : null}
            <div className="text-ink-muted">{truncate(m.content, 200)}</div>
          </div>
        ),
      },
      {
        key: 'sentiment',
        label: 'Sentimiento',
        width: '120px',
        sortable: true,
        sortAccessor: (m) => m.sentiment_score ?? -Infinity,
        render: (m) => (
          <Badge variant={sentimentBadgeVariant(m.sentiment_label)}>
            {sentimentLabel(m.sentiment_label)}
          </Badge>
        ),
      },
      {
        key: 'engagement',
        label: 'Engagement',
        width: '110px',
        sortable: true,
        sortAccessor: (m) => engagementSum(m),
        mobileHidden: true,
        render: (m) => {
          const sum = engagementSum(m)
          return (
            <span className="font-mono text-xs tabular-nums text-ink-muted">
              {sum > 0 ? formatNumber(sum, { compact: true }) : '—'}
            </span>
          )
        },
      },
      {
        key: 'collected_at',
        label: 'Recolectada',
        width: '130px',
        sortable: true,
        sortAccessor: (m) => new Date(m.collected_at).getTime(),
        mobileHidden: true,
        render: (m) => (
          <span className="text-xs font-mono text-ink-subtle">
            {formatRelativeTime(m.collected_at)}
          </span>
        ),
      },
      {
        key: 'url',
        label: 'URL',
        width: '60px',
        sortable: false,
        mobileHidden: true,
        render: (m) =>
          m.url ? (
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-ink-muted hover:text-ink"
              aria-label="Abrir fuente original"
              title={m.url}
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <span className="text-ink-subtle">—</span>
          ),
      },
    ],
    [],
  )

  // ---------- Render ----------
  if (isInitialLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <PageHeader
          title="Fuentes"
          subtitle="Todas las menciones — filtros, busqueda, sort, export CSV"
        />
        <SkeletonTable rows={8} />
      </div>
    )
  }

  if (queryError) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <PageHeader
          title="Fuentes"
          subtitle="Todas las menciones — filtros, busqueda, sort, export CSV"
        />
        <ErrorState
          title="No pudimos cargar las menciones"
          description="El endpoint /mentions respondio con error. Reintenta."
          onRetry={() => {
            for (const q of activeQueries) q.refetch()
          }}
        />
      </div>
    )
  }

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const lastActive = activeQueries[activeQueries.length - 1]
  const canLoadMore =
    loadedPages < MAX_PAGES &&
    (lastActive?.data?.length ?? 0) === PAGE_SIZE_BACKEND

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Fuentes"
        subtitle="Todas las menciones — filtros, busqueda, sort, export CSV"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportMentionsCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download size={14} aria-hidden="true" />
            Exportar CSV
          </Button>
        }
      />

      {/* Filters bar */}
      <Card className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="mentions-search"
              className="block text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1"
            >
              Buscar (contenido / autor / titulo)
            </label>
            <Input
              id="mentions-search"
              type="search"
              placeholder="Ej: corrupcion, @username, AMLO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="sentiment-filter"
              className="block text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1"
            >
              Sentimiento
            </label>
            <select
              id="sentiment-filter"
              value={sentimentFilter}
              onChange={(e) =>
                setSentimentFilter(e.target.value as SentimentFilter)
              }
              className="bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary h-10"
            >
              {SENTIMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="date-range"
              className="block text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1"
            >
              Rango de fecha
            </label>
            <select
              id="date-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary h-10"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sort-key"
              className="block text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1"
            >
              Ordenar
            </label>
            <select
              id="sort-key"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary h-10"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform multi-select chips */}
        {availablePlatforms.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle">
                Plataformas
              </span>
              {selectedPlatforms.size > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedPlatforms(new Set())}
                  className="text-[10px] font-mono uppercase tracking-wide text-ink-muted hover:text-ink underline underline-offset-2"
                >
                  Limpiar ({selectedPlatforms.size})
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availablePlatforms.map((p) => {
                const active = selectedPlatforms.has(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide border transition-colors',
                      active
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-elevated text-ink border-border hover:bg-black/[0.04] dark:hover:bg-white/[0.04]',
                    )}
                    aria-pressed={active}
                  >
                    {platformLabel(p)}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* google_trends toggle + caveat */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-border">
          <label className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeGoogleTrends}
              onChange={(e) => setExcludeGoogleTrends(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Excluir google_trends
          </label>
          <div className="flex items-start gap-1.5 text-[11px] text-ink-subtle">
            <Info size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              Plataforma <code className="font-mono">google_trends</code> contiene
              contenido sintetico de Google Trends, no menciones reales. Excluida
              por defecto.
            </span>
          </div>
        </div>
      </Card>

      {/* Counter + load more */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs font-mono text-ink-muted tabular-nums">
          Mostrando{' '}
          <span className="text-ink">{formatNumber(filtered.length)}</span> de{' '}
          <span className="text-ink">{formatNumber(allMentions.length)}</span>{' '}
          menciones cargadas
          {filtered.length !== allMentions.length ? ' (filtradas)' : ''}
        </div>
        {canLoadMore ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLoadedPages((p) => Math.min(MAX_PAGES, p + 1))}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Cargando...
              </>
            ) : (
              `Cargar mas (siguiente ${PAGE_SIZE_BACKEND})`
            )}
          </Button>
        ) : null}
      </div>

      {/* Table */}
      {allMentions.length === 0 ? (
        <EmptyState
          title="Sin menciones registradas"
          description="El backend no devolvio menciones para este politico en el rango cargado."
        />
      ) : (
        <DataTable<Mention>
          data={filtered}
          columns={columns}
          pageSize={20}
          hideSearch
          emptyMessage="Ningun resultado para los filtros actuales"
        />
      )}
    </div>
  )
}

export default Fuentes
