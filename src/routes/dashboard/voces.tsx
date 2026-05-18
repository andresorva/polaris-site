import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Heart,
  Network,
  Users,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonTable } from '../../components/states/LoadingSkeleton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import {
  useCoordinationGroups,
  useTopAuthors,
} from '../../lib/api/queries'
import type { TopAuthor, TopAuthorsScope } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type WindowDays = 7 | 30 | 90

// Note: backend `TopAuthorsScope` only supports 'third_party' | 'comments' | 'all'
// (no 'own'). Spec mentioned Propio but endpoint does not accept it, so we
// surface only the three real variants to avoid 400s.
const SCOPES: Array<{ value: TopAuthorsScope; label: string }> = [
  { value: 'third_party', label: 'Terceros' },
  { value: 'all', label: 'Todos' },
  { value: 'comments', label: 'Comentarios' },
]

const WINDOWS: Array<{ value: WindowDays; label: string }> = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

// ---------------------------------------------------------------------------
// Synthetic noise filter — google_trends + author 'MX' must be excluded from
// every display per DataAudit.
// ---------------------------------------------------------------------------

function isSyntheticNoise(a: TopAuthor): boolean {
  if (a.author === 'MX') return true
  if ((a.platforms ?? []).includes('google_trends')) return true
  return false
}

function filterSynthetic(authors: TopAuthor[] | undefined): TopAuthor[] {
  if (!authors) return []
  return authors.filter((a) => !isSyntheticNoise(a))
}

// ---------------------------------------------------------------------------
// Sortable table for top critics
// ---------------------------------------------------------------------------

type SortKey = 'negative' | 'count' | 'pct_negative' | 'author'
type SortDir = 'asc' | 'desc'

function sortAuthors(
  authors: TopAuthor[],
  key: SortKey,
  dir: SortDir,
): TopAuthor[] {
  const sorted = [...authors].sort((a, b) => {
    let av: number | string
    let bv: number | string
    switch (key) {
      case 'author':
        av = a.author ?? ''
        bv = b.author ?? ''
        break
      case 'count':
        av = a.count
        bv = b.count
        break
      case 'pct_negative':
        av = a.pct_negative
        bv = b.pct_negative
        break
      case 'negative':
      default:
        av = a.negative
        bv = b.negative
        break
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    const an = typeof av === 'number' ? av : 0
    const bn = typeof bv === 'number' ? bv : 0
    return dir === 'asc' ? an - bn : bn - an
  })
  return sorted
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wide text-ink-muted hover:text-ink transition-colors',
        align === 'right' && 'flex-row-reverse',
      )}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
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
  )
}

function PctNegativeBar({ pct }: { pct: number }) {
  // pct is 0..1 from backend
  const clamped = Math.max(0, Math.min(1, pct))
  const widthPct = (clamped * 100).toFixed(0)
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 sm:w-24 rounded-full bg-surface overflow-hidden"
        role="img"
        aria-label={`${(clamped * 100).toFixed(0)} por ciento negativo`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${widthPct}%`,
            backgroundColor: 'var(--polaris-sentiment-negative)',
          }}
        />
      </div>
      <span className="font-mono text-xs text-ink-muted tabular-nums shrink-0">
        {(clamped * 100).toFixed(0)}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top Critics table (GREEN)
// ---------------------------------------------------------------------------

function TopCriticsTable({ authors }: { authors: TopAuthor[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('negative')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(
    () => sortAuthors(authors, sortKey, sortDir).slice(0, 20),
    [authors, sortKey, sortDir],
  )

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'author' ? 'asc' : 'desc')
    }
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="Sin criticos validos"
        description="Tras filtrar synthetic noise (google_trends + author 'MX'), no quedan candidatos en la ventana seleccionada."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-3">
              <SortHeader
                label="Autor"
                active={sortKey === 'author'}
                dir={sortDir}
                onClick={() => toggleSort('author')}
              />
            </th>
            <th className="text-left py-2 pr-3 hidden sm:table-cell">
              <span className="text-xs font-mono uppercase tracking-wide text-ink-muted">
                Plataformas
              </span>
            </th>
            <th className="text-right py-2 pr-3">
              <SortHeader
                label="Menciones"
                active={sortKey === 'count'}
                dir={sortDir}
                onClick={() => toggleSort('count')}
                align="right"
              />
            </th>
            <th className="text-right py-2 pr-3">
              <SortHeader
                label="Negativas"
                active={sortKey === 'negative'}
                dir={sortDir}
                onClick={() => toggleSort('negative')}
                align="right"
              />
            </th>
            <th className="text-left py-2">
              <SortHeader
                label="% Negativo"
                active={sortKey === 'pct_negative'}
                dir={sortDir}
                onClick={() => toggleSort('pct_negative')}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => (
            <tr
              key={`${a.author}-${i}`}
              className="border-b border-border last:border-b-0"
            >
              <td className="py-2 pr-3">
                <div className="font-medium text-ink truncate max-w-[200px]">
                  {a.author}
                </div>
                <div className="text-xs text-ink-muted sm:hidden truncate max-w-[200px]">
                  {(a.platforms ?? []).join(', ') || '(sin plataforma)'}
                </div>
              </td>
              <td className="py-2 pr-3 hidden sm:table-cell">
                <div className="flex flex-wrap gap-1">
                  {(a.platforms ?? []).slice(0, 3).map((p) => (
                    <Badge key={p} variant="default" className="text-[10px]">
                      {p}
                    </Badge>
                  ))}
                  {(a.platforms ?? []).length === 0 ? (
                    <span className="text-xs text-ink-subtle">(sin)</span>
                  ) : null}
                </div>
              </td>
              <td className="py-2 pr-3 text-right font-mono text-sm text-ink tabular-nums">
                {a.count}
              </td>
              <td className="py-2 pr-3 text-right font-mono text-sm text-sentiment-negative tabular-nums">
                {a.negative}
              </td>
              <td className="py-2">
                <PctNegativeBar pct={a.pct_negative} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recurrent critics map (GREEN derived: negative >= 5)
// ---------------------------------------------------------------------------

function RecurrentCriticsGrid({ authors }: { authors: TopAuthor[] }) {
  const recurrent = useMemo(
    () =>
      [...authors]
        .filter((a) => a.negative >= 5)
        .sort((a, b) => b.negative - a.negative),
    [authors],
  )

  if (recurrent.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle size={48} strokeWidth={1.5} />}
        title="Sin cuentas recurrentes"
        description="Ningun autor alcanza el umbral de 5+ menciones negativas en la ventana actual."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {recurrent.map((a, i) => (
        <div
          key={`${a.author}-${i}`}
          className="border border-border rounded-md p-3 bg-surface"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink truncate">{a.author}</div>
              <div className="text-xs text-ink-muted truncate mt-0.5">
                {(a.platforms ?? []).join(', ') || '(sin plataforma)'}
              </div>
            </div>
            <Badge variant="negative" className="shrink-0">
              {a.negative} neg
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
            <span>
              <span className="font-mono tabular-nums text-ink">{a.count}</span>{' '}
              menc.
            </span>
            <span className="font-mono tabular-nums">
              {(a.pct_negative * 100).toFixed(0)}% neg
            </span>
          </div>
          {/* Sparkline placeholder — backend no expone serie temporal por autor */}
          <div
            className="mt-3 h-6 rounded-sm border border-dashed border-border flex items-center justify-center text-[10px] text-ink-subtle italic"
            aria-hidden="true"
          >
            sparkline pendiente (sin serie por autor)
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top non-critical voices (YELLOW heuristic)
// ---------------------------------------------------------------------------

function NonCriticalVoices({ authors }: { authors: TopAuthor[] }) {
  // Heuristica: pct_negative ASC, slice 5. Requires count > 0.
  const candidates = useMemo(
    () =>
      [...authors]
        .filter((a) => a.count > 0)
        .sort((a, b) => a.pct_negative - b.pct_negative)
        .slice(0, 5),
    [authors],
  )

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={48} strokeWidth={1.5} />}
        title="Sin candidatos"
        description="Tras filtrar synthetic noise, no quedan autores para evaluar como 'no criticos'."
      />
    )
  }

  return (
    <ul className="space-y-2">
      {candidates.map((a, i) => (
        <li
          key={`${a.author}-${i}`}
          className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0"
        >
          <div className="min-w-0">
            <div className="font-medium text-ink truncate">{a.author}</div>
            <div className="text-xs text-ink-muted truncate">
              {(a.platforms ?? []).join(', ') || '(sin plataforma)'}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-sm text-ink tabular-nums">
              {a.count} menc.
            </div>
            <div className="text-xs text-ink-muted tabular-nums">
              {(a.pct_negative * 100).toFixed(0)}% neg
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Voces y criticos route
// ---------------------------------------------------------------------------

export function Voces() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  const [scope, setScope] = useState<TopAuthorsScope>('third_party')
  const [windowDays, setWindowDays] = useState<WindowDays>(30)

  // Critics: respects user scope + window
  const criticsQ = useTopAuthors(politicianId, {
    limit: 50,
    days: windowDays,
    scope,
  })

  // Non-critics heuristic: always scope=all, same window
  const allAuthorsQ = useTopAuthors(politicianId, {
    limit: 50,
    days: windowDays,
    scope: 'all',
  })

  const coordQ = useCoordinationGroups(politicianId)

  const filteredCritics = useMemo(
    () => filterSynthetic(criticsQ.data?.authors),
    [criticsQ.data],
  )
  const filteredAll = useMemo(
    () => filterSynthetic(allAuthorsQ.data?.authors),
    [allAuthorsQ.data],
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Voces y criticos"
        subtitle="Top autores, criticos recurrentes, coordinacion"
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-xs font-mono uppercase tracking-wide text-ink-muted">
              Scope
            </span>
            <div
              role="radiogroup"
              aria-label="Scope de menciones"
              className="inline-flex flex-wrap rounded-md border border-border overflow-hidden bg-surface"
            >
              {SCOPES.map((opt) => {
                const active = scope === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setScope(opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                      active
                        ? 'bg-primary text-white'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-elevated',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-xs font-mono uppercase tracking-wide text-ink-muted">
              Ventana
            </span>
            <div
              role="radiogroup"
              aria-label="Ventana de tiempo"
              className="inline-flex rounded-md border border-border overflow-hidden bg-surface"
            >
              {WINDOWS.map((opt) => {
                const active = windowDays === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setWindowDays(opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                      active
                        ? 'bg-primary text-white'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-elevated',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Section 1: Top 20 críticos */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Top 20 criticos ({windowDays}d · {scope})
          </h2>
        </div>
        {criticsQ.isLoading ? (
          <SkeletonTable rows={8} />
        ) : criticsQ.isError ? (
          <ErrorState onRetry={() => criticsQ.refetch()} />
        ) : (
          <TopCriticsTable authors={filteredCritics} />
        )}
      </Card>

      {/* Section 2: Mapa críticos recurrentes */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Cuentas con 5+ menciones negativas ({windowDays}d)
          </h2>
        </div>
        <p className="text-xs text-ink-muted mb-3">
          Derivado del mismo top-authors filtrando <code>negative &gt;= 5</code>.
        </p>
        {criticsQ.isLoading ? (
          <SkeletonTable rows={3} />
        ) : criticsQ.isError ? (
          <ErrorState onRetry={() => criticsQ.refetch()} />
        ) : (
          <RecurrentCriticsGrid authors={filteredCritics} />
        )}
      </Card>

      {/* Section 3: Top voces NO criticas (heuristica) */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Heart size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Top voces NO criticas (heuristica · {windowDays}d)
          </h2>
        </div>
        <p className="text-xs text-ink-muted italic mb-3">
          Heuristica — backend no expone "defensores" explicitamente. Es "menos
          criticas" relativo: ordenado por <code>pct_negative ASC</code> sobre
          scope=all.
        </p>
        {allAuthorsQ.isLoading ? (
          <SkeletonTable rows={5} />
        ) : allAuthorsQ.isError ? (
          <ErrorState onRetry={() => allAuthorsQ.refetch()} />
        ) : (
          <NonCriticalVoices authors={filteredAll} />
        )}
      </Card>

      {/* Section 4: Deteccion coordinacion (RED) */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Network size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Deteccion de coordinacion
          </h2>
        </div>
        {coordQ.isLoading ? (
          <SkeletonTable rows={3} />
        ) : coordQ.isError ? (
          <ErrorState onRetry={() => coordQ.refetch()} />
        ) : (coordQ.data?.groups ?? []).length === 0 ? (
          <EmptyState
            icon={<Network size={48} strokeWidth={1.5} />}
            title="Coordinacion no detectada"
            description="Detector backend pendiente Wave B. No hay grupos de cuentas coordinadas identificados aun."
          />
        ) : (
          <ul className="space-y-2">
            {coordQ.data!.groups.map((g) => (
              <li
                key={g.id}
                className="border border-border rounded-md px-3 py-2"
              >
                <div className="text-sm text-ink font-medium">
                  Grupo {g.id.slice(0, 8)}
                </div>
                <div className="text-xs text-ink-muted">
                  Detectado: {g.detected_at} · resolved: {String(g.is_resolved)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default Voces
