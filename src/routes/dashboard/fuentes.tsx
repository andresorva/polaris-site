/**
 * Fuentes - mockup 11-fuentes.
 *
 * Todas las menciones clasificadas en una tabla densa, con el detalle de los 9
 * agentes al hacer click en cualquier fila. La pantalla solo orquesta: fetch
 * paginado (useMentions), filtros de cliente (busqueda + plataforma) y deep-link
 * por ?topic; la tabla y el modal son componentes presentacionales reusados.
 *
 *   - Tabla -> MentionsDataTable (densidad, orden por columna, paginacion y
 *     modal interno, todo dentro del componente).
 *   - Detalle -> MentionDetailModal (GET /mentions/{id}, salida granular de los
 *     9 agentes), montado por la propia tabla al click.
 *   - Deep-link -> ?topic=<categoria> filtra por topic (lo dispara Alertas).
 *
 * google_trends es contenido sintetico de Google Trends (no menciones reales);
 * se excluye por defecto y el usuario lo puede reactivar con el toggle.
 *
 * REGLA 79: ASCII-only en todo string visible. Sin acentos ni n-con-tilde.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Info, Loader2, X } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonTable } from '../../components/states/LoadingSkeleton'
import { MentionsDataTable } from '../../components/data-display/MentionsDataTable'
import { ExportButton, type CsvColumn } from '../../components/data-display/ExportButton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { useMentions } from '../../lib/api/queries'
import type { Mention } from '../../lib/api/types'
import { platformLabel } from '../../lib/utils/platform'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE_BACKEND = 500 // backend hard cap (422 si > 500)
const MAX_PAGES = 4

// ---------------------------------------------------------------------------
// Local ASCII helpers (nunca tocan utils compartidos)
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

/** Texto plano del topic principal (ASCII, guiones bajos a espacios). */
function primaryTopic(m: Mention): string {
  const t = m.topic_categories?.[0]
  return t ? t.replace(/_/g, ' ') : ''
}

/** `YYYY-MM-DD HH:MM` sin nombres de mes localizados (=> sin acentos). */
function fmtTimestampAscii(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// CSV: columnas explicitas (header sin acentos, accessor por fila).
const CSV_COLUMNS: CsvColumn<Mention>[] = [
  { header: 'id', accessor: (m) => m.id },
  { header: 'timestamp', accessor: (m) => fmtTimestampAscii(m.collected_at) },
  { header: 'platform', accessor: (m) => m.platform },
  { header: 'author', accessor: (m) => m.author ?? m.author_handle ?? '' },
  { header: 'sentiment_label', accessor: (m) => m.sentiment_label ?? '' },
  { header: 'sentiment_score', accessor: (m) => m.sentiment_score ?? '' },
  { header: 'topic', accessor: (m) => primaryTopic(m) },
  { header: 'engagement', accessor: (m) => engagementSum(m) },
  { header: 'content', accessor: (m) => m.content ?? '' },
  { header: 'url', accessor: (m) => m.url ?? '' },
]

// ---------------------------------------------------------------------------
// Fuentes route
// ---------------------------------------------------------------------------

export function Fuentes() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  // Deep-link por topic (lo dispara Alertas). Solo lectura de la URL.
  const [searchParams, setSearchParams] = useSearchParams()
  const topicParam = searchParams.get('topic')?.trim() ?? ''

  // ---------- Fetch paginado (1..MAX_PAGES x 500) ----------
  const [loadedPages, setLoadedPages] = useState(1)

  // Una query por pagina; el fetch real se gatilla pasando el politicianId
  // (vacio => deshabilitado via enabled de useMentions). Orden de hooks fijo.
  const q0 = useMentions(politicianId, { limit: PAGE_SIZE_BACKEND, offset: 0 })
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
    // Dedupe por id (defensivo).
    const seen = new Set<string>()
    return out.filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q0.data, q1.data, q2.data, q3.data, loadedPages])

  // ---------- Filtros de cliente ----------
  const [search, setSearch] = useState('')
  const [excludeGoogleTrends, setExcludeGoogleTrends] = useState(true)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  )

  // Plataformas presentes en la data cargada (orden alfabetico).
  const availablePlatforms = useMemo(() => {
    const s = new Set<string>()
    for (const m of allMentions) s.add(m.platform)
    return Array.from(s).sort()
  }, [allMentions])

  // ---------- Aplicar filtros ----------
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const topicNeedle = topicParam.toLowerCase()

    return allMentions.filter((m) => {
      // Exclusion de google_trends (salvo seleccion explicita del usuario).
      if (
        excludeGoogleTrends &&
        m.platform === 'google_trends' &&
        !selectedPlatforms.has('google_trends')
      ) {
        return false
      }
      // Seleccion de plataforma (set vacio => todas, modulo regla gtrends).
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(m.platform)) {
        return false
      }
      // Deep-link por topic: coincide con cualquier categoria de la mencion.
      if (topicNeedle) {
        const cats = m.topic_categories ?? []
        const hit = cats.some((c) =>
          c.replace(/_/g, ' ').toLowerCase().includes(topicNeedle),
        )
        if (!hit) return false
      }
      // Busqueda full-text (contenido / autor / titulo).
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
  }, [allMentions, search, excludeGoogleTrends, selectedPlatforms, topicParam])

  // ---------- Helpers de UI ----------
  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  function clearTopic() {
    const next = new URLSearchParams(searchParams)
    next.delete('topic')
    setSearchParams(next, { replace: true })
  }

  const lastActive = activeQueries[activeQueries.length - 1]
  const canLoadMore =
    loadedPages < MAX_PAGES &&
    (lastActive?.data?.length ?? 0) === PAGE_SIZE_BACKEND

  // ---------- Page head (espeja .page-head del mockup) ----------
  const head = (
    <header>
      <div className="text-xs font-mono uppercase tracking-wide text-ink-subtle">
        Operacion · Datos
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-ink">Fuentes</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">
        Todas las menciones clasificadas. Ajusta la densidad, ordena por columna y
        abre el detalle completo al hacer clic en cualquier fila.
      </p>
    </header>
  )

  // ---------- Estados de carga / error a nivel pagina ----------
  if (isInitialLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {head}
        <SkeletonTable rows={10} />
      </div>
    )
  }

  if (queryError) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {head}
        <ErrorState
          title="No pudimos cargar las menciones"
          description="No se pudieron cargar las menciones. Reintenta."
          onRetry={() => {
            for (const q of activeQueries) q.refetch()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {head}

      {/* Toolbar: busqueda + chips de plataforma + export */}
      <Card className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Buscador */}
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              type="search"
              aria-label="Buscar texto, autor o topic"
              placeholder="Buscar texto, autor, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Plataformas como chips toggleables */}
          {availablePlatforms.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {availablePlatforms.map((p) => {
                const active = selectedPlatforms.has(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-border-subtle bg-card text-ink-muted hover:border-border-strong hover:text-ink',
                    )}
                  >
                    {platformLabel(p)}
                  </button>
                )
              })}
              {selectedPlatforms.size > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedPlatforms(new Set())}
                  className="text-[10px] font-mono uppercase tracking-wide text-ink-muted underline underline-offset-2 hover:text-ink"
                >
                  Limpiar ({selectedPlatforms.size})
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Export CSV + PDF */}
          <ExportButton<Mention>
            filename="fuentes-menciones"
            rows={filtered}
            columns={CSV_COLUMNS}
            variant="secondary"
            size="sm"
            disabled={filtered.length === 0}
            className="lg:ml-auto"
          />
        </div>

        {/* Toggle google_trends + caveat honesto */}
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer select-none items-center gap-2 font-mono text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={excludeGoogleTrends}
              onChange={(e) => setExcludeGoogleTrends(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Excluir Google Trends
          </label>
          <div className="flex items-start gap-1.5 text-[11px] text-ink-subtle">
            <Info size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              Google Trends muestra temas de busqueda, no menciones reales. Se
              excluye por defecto.
            </span>
          </div>
        </div>
      </Card>

      {/* Banner de deep-link por topic */}
      {topicParam ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-sunken px-3 py-2 text-sm">
          <span className="text-ink-muted">Filtrando por topic</span>
          <span className="inline-flex items-center rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-ink">
            {topicParam.replace(/_/g, ' ')}
          </span>
          <button
            type="button"
            onClick={clearTopic}
            className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted underline underline-offset-2 hover:text-ink"
          >
            <X size={12} aria-hidden="true" />
            Quitar filtro
          </button>
        </div>
      ) : null}

      {/* Cargar mas (paginas backend de 500) */}
      {canLoadMore ? (
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLoadedPages((p) => Math.min(MAX_PAGES, p + 1))}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Cargando...
              </>
            ) : (
              `Cargar mas (siguiente ${PAGE_SIZE_BACKEND})`
            )}
          </Button>
        </div>
      ) : null}

      {/* Tabla (densidad / orden / paginacion / modal de 9 agentes, todo dentro).
          allMentions vacio => empty-state honesto a nivel pagina; con datos pero
          sin match de filtros => la tabla muestra su propio EmptyState. */}
      {allMentions.length === 0 ? (
        <EmptyState
          title="Sin menciones registradas"
          description="Aun no hay menciones para este cliente en el periodo cargado."
        />
      ) : (
        <Card className="p-0">
          <MentionsDataTable
            data={filtered}
            pageSize={20}
            initialSortKey="collected_at"
            initialSortDir="desc"
            emptyTitle="Sin resultados"
            emptyDescription="Ninguna mencion coincide con los filtros actuales."
            className="p-3 sm:p-4"
          />
        </Card>
      )}
    </div>
  )
}

export default Fuentes
