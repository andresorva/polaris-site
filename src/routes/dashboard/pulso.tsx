/**
 * Pulso en vivo (v3) - busqueda en tiempo real con stream SSE.
 *
 * Mockup de referencia: polaris-design-v3/05-pulso-en-vivo.html
 *
 * Contrato (Wave 2, ya en backend):
 *   POST /api/v1/live-query   body { query, platforms, time_range, politician_id }
 *   evento SSE "mention" con payload wire { plat, author, text, score, sent, eng,
 *   timestamp, url } -> normalizado via normalizePulsoMention.
 *
 * El contrato anterior enviaba { question, context } -> 422. Aqui se usa el
 * nombre nuevo de campo `query` + filtros planos `platforms`/`time_range`.
 *
 * Estados: idle (empty/radar) | streaming (live) | complete (summary) | error.
 * Stagger de cards via keyframes streamIn (definido inline, file-local) y se
 * desactiva con prefers-reduced-motion.
 *
 * REGLA 79: cero acentos en strings visibles.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  ExternalLink,
  Heart,
  MessageCircle,
  Plus,
  Radar,
  Repeat2,
  Search,
  Square,
  Star,
  X,
} from 'lucide-react'

import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PlatformChip } from '../../components/data-display/PlatformChip'
import { SentimentBar } from '../../components/charts/SentimentBar'
import type { SentimentCounts } from '../../components/charts/sentimentColors'
import { DemoBadge } from '../../components/states/DemoBadge'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'

import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { ENDPOINTS } from '../../lib/api/endpoints'
import {
  streamPost,
  isPulsoMentionWire,
  normalizePulsoMention,
  type SseEvent,
} from '../../lib/api/sse'
import type { Mention, SentimentLabel } from '../../lib/api/types'
import { formatNumber, formatRelativeTime } from '../../lib/utils/format'
import { platformLabel } from '../../lib/utils/platform'
import { sentimentLabel } from '../../lib/utils/sentiment'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://web-production-d6505.up.railway.app'

function getApiBase(): string {
  const env = (
    import.meta as unknown as { env?: Record<string, string | undefined> }
  ).env
  return (env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
}

const PLATFORM_CHOICES: { id: string; label: string; defaultOn: boolean }[] = [
  { id: 'twitter', label: 'Twitter', defaultOn: true },
  { id: 'bluesky', label: 'Bluesky', defaultOn: true },
  { id: 'instagram', label: 'Instagram', defaultOn: false },
  { id: 'tiktok', label: 'TikTok', defaultOn: false },
  { id: 'youtube', label: 'YouTube', defaultOn: false },
  { id: 'news', label: 'News MX', defaultOn: true },
]

const TIME_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: '1h', label: 'Ultima hora' },
  { value: '24h', label: 'Ultimas 24 horas' },
  { value: '7d', label: 'Ultimos 7 dias' },
]

const SAVED_SEARCHES_KEY = 'polaris_saved_searches_v3'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SavedSearch = {
  id: string
  label: string
  query: string
  platforms: string[]
  timeRange: string
  savedAt: number
}

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error'

type StreamState = {
  status: StreamStatus
  mentions: Mention[]
  progressMsg: string
  errorMsg: string | null
  startedAt: number | null
}

type StreamAction =
  | { type: 'start' }
  | { type: 'progress'; message: string }
  | { type: 'mention'; mention: Mention }
  | { type: 'done' }
  | { type: 'error'; message: string }
  | { type: 'reset' }

const initialStreamState: StreamState = {
  status: 'idle',
  mentions: [],
  progressMsg: '',
  errorMsg: null,
  startedAt: null,
}

function streamReducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case 'reset':
      return initialStreamState
    case 'start':
      return {
        ...initialStreamState,
        status: 'connecting',
        progressMsg: 'Conectando...',
        startedAt: Date.now(),
      }
    case 'progress':
      return {
        ...state,
        status: state.status === 'connecting' ? 'streaming' : state.status,
        progressMsg: action.message,
      }
    case 'mention': {
      // Dedupe por id: algunos backends repiten una mencion entre plataformas.
      if (state.mentions.some((m) => m.id === action.mention.id)) {
        return state
      }
      return {
        ...state,
        status: 'streaming',
        mentions: [action.mention, ...state.mentions],
      }
    }
    case 'done':
      // Si erroramos antes, no pisamos el estado de error.
      if (state.status === 'error') return state
      return { ...state, status: 'complete', progressMsg: 'Busqueda completa' }
    case 'error':
      return { ...state, status: 'error', errorMsg: action.message }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function truncate(text: string | null | undefined, n: number): string {
  if (!text) return ''
  if (text.length <= n) return text
  return text.slice(0, n).trimEnd() + '...'
}

function safeReadSavedSearches(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is SavedSearch =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as SavedSearch).id === 'string' &&
        typeof (s as SavedSearch).label === 'string' &&
        typeof (s as SavedSearch).query === 'string' &&
        Array.isArray((s as SavedSearch).platforms) &&
        typeof (s as SavedSearch).timeRange === 'string' &&
        typeof (s as SavedSearch).savedAt === 'number',
    )
  } catch {
    return []
  }
}

function persistSavedSearches(rows: SavedSearch[]) {
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(rows))
  } catch {
    // Quota / modo privado - noop silencioso.
  }
}

/** Agrupa el sentiment_label de las menciones en cubetas para SentimentBar. */
function toSentimentCounts(mentions: Mention[]): SentimentCounts {
  const counts: SentimentCounts = {}
  for (const m of mentions) {
    const lbl = m.sentiment_label
    if (lbl === 'positive') counts.positive = (counts.positive ?? 0) + 1
    else if (lbl === 'negative') counts.negative = (counts.negative ?? 0) + 1
    else if (lbl === 'neutral') counts.neutral = (counts.neutral ?? 0) + 1
    else if (lbl === 'mixed') counts.mixed = (counts.mixed ?? 0) + 1
    else if (lbl === 'sarcastic')
      counts.sarcastic = (counts.sarcastic ?? 0) + 1
  }
  return counts
}

function negativePct(mentions: Mention[]): number {
  const total = mentions.length
  if (total === 0) return 0
  const neg = mentions.filter((m) => m.sentiment_label === 'negative').length
  return (neg / total) * 100
}

function topPlatform(mentions: Mention[]): string | null {
  if (mentions.length === 0) return null
  const counts: Record<string, number> = {}
  for (const m of mentions) {
    counts[m.platform] = (counts[m.platform] ?? 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? sorted[0][0] : null
}

// ---------------------------------------------------------------------------
// Inline MentionCard - replica visual del .m-card del mockup 05
// ---------------------------------------------------------------------------

function scoreClass(label: SentimentLabel | null | undefined): string {
  switch (label) {
    case 'negative':
      return 'bg-sentiment-negative/15 text-sentiment-negative'
    case 'positive':
      return 'bg-sentiment-positive/15 text-sentiment-positive'
    default:
      return 'bg-sunken text-ink-muted'
  }
}

function MentionCard({
  mention,
  animate,
  index,
}: {
  mention: Mention
  animate: boolean
  index: number
}) {
  const eng = mention.engagement_metrics ?? {}
  const likes = typeof eng.likes === 'number' ? eng.likes : null
  const reposts = typeof eng.reposts === 'number' ? eng.reposts : null
  const comments = typeof eng.comments === 'number' ? eng.comments : null
  const hasEng = likes !== null || reposts !== null || comments !== null

  return (
    <article
      className={cn(
        'rounded-md border border-border bg-card p-3.5',
        animate && 'pulso-stream-in',
      )}
      style={
        animate
          ? // Stagger leve solo para las primeras cards (evita jank en feeds largos).
            { animationDelay: `${Math.min(index, 6) * 50}ms` }
          : undefined
      }
    >
      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-ink-subtle">
        <PlatformChip platform={mention.platform} />
        <span className="truncate font-semibold text-ink-muted">
          {mention.author_handle ?? mention.author ?? 'desconocido'}
        </span>
        <span className="text-ink-subtle">
          {formatRelativeTime(mention.collected_at)}
        </span>
        <span
          className={cn(
            'ml-auto shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
            scoreClass(mention.sentiment_label),
          )}
          title={sentimentLabel(mention.sentiment_label)}
        >
          {typeof mention.sentiment_score === 'number'
            ? mention.sentiment_score.toFixed(2)
            : sentimentLabel(mention.sentiment_label)}
        </span>
      </div>

      {mention.title ? (
        <div className="mb-0.5 text-sm font-semibold text-ink">
          {truncate(mention.title, 140)}
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-ink">
        {truncate(mention.content, 280)}
      </p>

      {hasEng || mention.url ? (
        <div className="mt-2 flex items-center gap-4 font-mono text-[11px] text-ink-subtle">
          {likes !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Heart size={12} aria-hidden="true" />
              {formatNumber(likes, { compact: true })}
            </span>
          ) : null}
          {reposts !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Repeat2 size={12} aria-hidden="true" />
              {formatNumber(reposts, { compact: true })}
            </span>
          ) : null}
          {comments !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={12} aria-hidden="true" />
              {formatNumber(comments, { compact: true })}
            </span>
          ) : null}
          {mention.url ? (
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              Ver fuente
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Pulso en vivo page
// ---------------------------------------------------------------------------

export function Pulso() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  // ---------- Form state ----------
  const [query, setQuery] = useState('')
  const [platforms, setPlatforms] = useState<Set<string>>(
    () => new Set(PLATFORM_CHOICES.filter((p) => p.defaultOn).map((p) => p.id)),
  )
  const [timeRange, setTimeRange] = useState<string>('24h')

  // ---------- Saved searches ----------
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    safeReadSavedSearches(),
  )

  const persistAndSet = useCallback((rows: SavedSearch[]) => {
    setSavedSearches(rows)
    persistSavedSearches(rows)
  }, [])

  const handleSaveCurrent = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    // Evita duplicados exactos por texto.
    if (savedSearches.some((s) => s.query === trimmed)) return
    const label = trimmed.length > 40 ? trimmed.slice(0, 40) + '...' : trimmed
    const newItem: SavedSearch = {
      id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      query: trimmed,
      platforms: Array.from(platforms),
      timeRange,
      savedAt: Date.now(),
    }
    persistAndSet([newItem, ...savedSearches].slice(0, 12))
  }, [query, platforms, timeRange, savedSearches, persistAndSet])

  const handleDeleteSaved = useCallback(
    (id: string) => {
      persistAndSet(savedSearches.filter((s) => s.id !== id))
    },
    [savedSearches, persistAndSet],
  )

  // ---------- Stream state ----------
  const [stream, dispatch] = useReducer(streamReducer, initialStreamState)
  const abortRef = useRef<AbortController | null>(null)
  const reduceMotion = useMemo(() => prefersReducedMotion(), [])

  const isStreaming =
    stream.status === 'connecting' || stream.status === 'streaming'

  // ---------- Submit ----------
  const runSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim()
      if (!trimmed || isStreaming) return

      // Aborta cualquier stream previo.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      dispatch({ type: 'start' })

      const url = `${getApiBase()}${ENDPOINTS.liveQuery}`
      // CONTRATO NUEVO (Wave 2): campo `query` (antes `question`) + filtros
      // planos `platforms` / `time_range`. El payload anterior con
      // { question, context } devolvia 422.
      const body = {
        query: trimmed,
        platforms: Array.from(platforms),
        time_range: timeRange,
        politician_id: politicianId,
      }

      await streamPost(
        url,
        body,
        {
          onEvent: (e: SseEvent) => {
            const data = e.data
            switch (e.event) {
              case 'mention':
              case 'message': {
                // Wire shape Pulso: { plat, author, text, score, sent, eng, ... }
                if (isPulsoMentionWire(data)) {
                  dispatch({
                    type: 'mention',
                    mention: normalizePulsoMention(data, {
                      politicianId,
                    }),
                  })
                } else if (typeof data === 'string') {
                  dispatch({ type: 'progress', message: data })
                }
                break
              }
              case 'progress':
              case 'status': {
                if (typeof data === 'string') {
                  dispatch({ type: 'progress', message: data })
                } else if (
                  typeof data === 'object' &&
                  data !== null &&
                  typeof (data as { message?: unknown }).message === 'string'
                ) {
                  dispatch({
                    type: 'progress',
                    message: (data as { message: string }).message,
                  })
                }
                break
              }
              case 'done':
              case 'complete':
                dispatch({ type: 'done' })
                break
              case 'error':
                dispatch({
                  type: 'error',
                  message:
                    typeof data === 'string'
                      ? data
                      : typeof data === 'object' &&
                          data !== null &&
                          typeof (data as { message?: unknown }).message ===
                            'string'
                        ? (data as { message: string }).message
                        : 'No se pudo completar la busqueda en vivo.',
                })
                break
              default:
                break
            }
          },
          onError: (err) => {
            const message =
              typeof err === 'object' && err !== null
                ? typeof (err as { detail?: unknown }).detail === 'string'
                  ? (err as { detail: string }).detail
                  : typeof (err as { statusText?: unknown }).statusText ===
                      'string'
                    ? `${(err as { status?: number }).status ?? 0} ${
                        (err as { statusText: string }).statusText
                      }`
                    : err instanceof Error
                      ? err.message
                      : 'Error de conexion'
                : 'Error de conexion'
            dispatch({ type: 'error', message })
          },
          onClose: () => {
            // onClose corre exactamente una vez. El reducer ignora `done` si ya
            // estamos en error, asi que es seguro disparar aqui el cierre limpio.
          },
        },
        controller.signal,
      )

      if (controller.signal.aborted) {
        // Cancelacion manual: volvemos a idle solo si no hubo data util.
        return
      }
      dispatch({ type: 'done' })
    },
    [isStreaming, platforms, timeRange, politicianId],
  )

  const handleSubmit = useCallback(() => {
    void runSearch(query)
  }, [runSearch, query])

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    // Tras cancelar mostramos lo acumulado como completo (o idle si vacio).
    dispatch({ type: 'done' })
  }, [])

  const handleReset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: 'reset' })
  }, [])

  const handleLoadSaved = useCallback(
    (s: SavedSearch) => {
      setQuery(s.query)
      setPlatforms(new Set(s.platforms))
      setTimeRange(s.timeRange)
      void runSearch(s.query)
    },
    [runSearch],
  )

  // Cleanup al desmontar.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  function togglePlatform(id: string) {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canSubmit =
    query.trim().length > 0 && !isStreaming && !!politicianId

  // ---------- Derived ----------
  const sentCounts = useMemo(
    () => toSentimentCounts(stream.mentions),
    [stream.mentions],
  )
  const negPct = useMemo(() => negativePct(stream.mentions), [stream.mentions])
  const topPlat = useMemo(
    () => topPlatform(stream.mentions),
    [stream.mentions],
  )

  const showStreamPanel = stream.status !== 'idle'
  const hasMentions = stream.mentions.length > 0

  // El stream live-query degrada a 0 mentions hasta que el backend cablee
  // dispatch real -> el panel puede quedar vacio/parcial; marcamos con DemoBadge.
  // API PENDIENTE: persistencia en DB de las menciones del stream (Wave B-1).

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Keyframes file-local (no se puede editar index.css). Respetan
          prefers-reduced-motion: si esta activo, no aplicamos la clase. */}
      <style>{`
        @keyframes pulsoStreamIn {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to { opacity: 1; transform: none; }
        }
        .pulso-stream-in { animation: pulsoStreamIn 0.45s cubic-bezier(0.16,1,0.3,1) both; transform-origin: top center; }
        @keyframes pulsoLiveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.82); }
        }
        .pulso-live-dot { animation: pulsoLiveDot 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pulso-stream-in { animation: none; }
          .pulso-live-dot { animation: none; }
        }
      `}</style>

      <PageHeader
        title="Pulso en vivo"
        subtitle="Busqueda en tiempo real: las menciones aparecen conforme se detectan y se clasifican al instante por sentimiento."
      />

      {/* ---- Search panel --------------------------------------------------- */}
      <Card className="space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle">
          Buscar en tiempo real
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) handleSubmit()
          }}
        >
          <div className="relative flex-1">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              id="pulso-query"
              type="search"
              placeholder="Cuajimalpa, baches, obras inconclusas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isStreaming}
              className="h-11 w-full pl-10"
              aria-label="Termino de busqueda"
            />
          </div>
          {isStreaming ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="h-11"
              aria-label="Detener stream"
            >
              <Square size={15} aria-hidden="true" />
              Detener
            </Button>
          ) : (
            <Button type="submit" disabled={!canSubmit} className="h-11">
              <Radar size={16} aria-hidden="true" />
              Buscar
            </Button>
          )}
        </form>

        {!politicianId ? (
          <p className="text-xs font-mono text-sentiment-negative">
            Selecciona un cliente para iniciar la busqueda.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle">
              Plataformas
            </span>
            {PLATFORM_CHOICES.map((p) => {
              const active = platforms.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  disabled={isStreaming}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wide transition-colors',
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-card text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.04]',
                    isStreaming && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="pulso-range"
              className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle"
            >
              Rango
            </label>
            <select
              id="pulso-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              disabled={isStreaming}
              className="h-9 rounded-full border border-border bg-card px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ---- Stream panel --------------------------------------------------- */}
      {showStreamPanel ? (
        <Card className="relative space-y-4">
          <DemoBadge className="absolute right-3 top-3" />

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide',
                isStreaming ? 'text-sentiment-negative' : 'text-ink-subtle',
              )}
            >
              <span
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  isStreaming
                    ? 'bg-sentiment-negative pulso-live-dot'
                    : 'bg-ink-subtle',
                )}
                aria-hidden="true"
              />
              En vivo
            </span>
            <span className="text-sm text-ink-subtle">
              -{' '}
              <span className="font-mono font-semibold text-ink tabular-nums">
                {formatNumber(stream.mentions.length)}
              </span>{' '}
              menciones encontradas
            </span>
            <span className="ml-auto">
              {stream.status === 'error' ? (
                <Badge variant="negative">Error</Badge>
              ) : stream.status === 'complete' ? (
                <Badge variant="positive">Completo</Badge>
              ) : (
                <Badge variant="accent">En vivo</Badge>
              )}
            </span>
            {!isStreaming ? (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Limpiar
              </Button>
            ) : null}
          </div>

          {isStreaming && stream.progressMsg ? (
            <div className="font-mono text-xs text-ink-subtle">
              {stream.progressMsg}
            </div>
          ) : null}

          {/* ---- Summary (estado complete) -------------------------------- */}
          {stream.status === 'complete' && hasMentions ? (
            <div className="rounded-md border border-primary/30 bg-primary/[0.06] p-4">
              <div className="mb-3 text-sm font-semibold text-ink">
                Busqueda completa
              </div>
              <div className="flex flex-wrap gap-8">
                <div>
                  <div className="font-mono text-xl font-semibold tabular-nums text-ink">
                    {formatNumber(stream.mentions.length)}
                  </div>
                  <div className="text-[11px] text-ink-subtle">menciones</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-semibold tabular-nums text-sentiment-negative">
                    {negPct.toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-ink-subtle">negativo</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-semibold text-ink">
                    {topPlat ? platformLabel(topPlat) : '-'}
                  </div>
                  <div className="text-[11px] text-ink-subtle">
                    plataforma top
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveCurrent}
                  disabled={!query.trim()}
                >
                  <Star size={14} aria-hidden="true" />
                  Guardar busqueda
                </Button>
              </div>
            </div>
          ) : null}

          {/* ---- Error state ---------------------------------------------- */}
          {stream.status === 'error' ? (
            <ErrorState
              title="Conexion en vivo interrumpida"
              description={
                stream.errorMsg
                  ? `La busqueda en vivo se corto: ${stream.errorMsg}`
                  : 'La busqueda en vivo se corto. Reintenta.'
              }
              onRetry={() => void runSearch(query)}
              retryLabel="Reintentar"
            />
          ) : !hasMentions && !isStreaming ? (
            /* ---- Empty post-busqueda (0 mentions) ------------------------- */
            <EmptyState
              title="Sin menciones para este termino"
              description="La busqueda en vivo no encontro resultados para los filtros actuales. Prueba con otra palabra clave, mas plataformas o un rango mas amplio."
              icon={<Radar size={48} strokeWidth={1.5} />}
            />
          ) : (
            /* ---- Data + live ---------------------------------------------- */
            <div className="space-y-3">
              <div>
                <SentimentBar
                  counts={sentCounts}
                  height={8}
                  ariaLabel="Distribucion de sentimiento en vivo"
                />
                <div className="mt-1.5 font-mono text-[11px] text-ink-subtle">
                  <span className="font-semibold text-sentiment-negative">
                    {negPct.toFixed(0)}%
                  </span>{' '}
                  negativo - sentimiento en vivo
                </div>
              </div>

              {hasMentions ? (
                <div className="space-y-2.5">
                  {stream.mentions.map((m, i) => (
                    <MentionCard
                      key={m.id}
                      mention={m}
                      animate={!reduceMotion}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center font-mono text-xs text-ink-subtle">
                  Esperando menciones en vivo...
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        /* ---- Idle (radar / empty inicial) -------------------------------- */
        <Card className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <Radar
            size={48}
            strokeWidth={1.5}
            className="text-primary"
            aria-hidden="true"
          />
          <h3 className="text-base font-semibold text-ink">
            Que quieres buscar?
          </h3>
          <p className="max-w-md text-sm text-ink-muted">
            Teclea un termino y presiona Buscar. Las menciones empezaran a caer
            en vivo, clasificadas por sentimiento al instante.
          </p>
        </Card>
      )}

      {/* ---- Saved searches ------------------------------------------------- */}
      <Card className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle">
          Busquedas guardadas
        </div>
        {savedSearches.length === 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-ink-muted">
              Aun no hay busquedas guardadas.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveCurrent}
              disabled={!query.trim() || isStreaming}
            >
              <Plus size={14} aria-hidden="true" />
              Guardar busqueda actual
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {savedSearches.map((s) => (
              <span
                key={s.id}
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-sunken px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-primary/40 hover:text-ink"
              >
                <button
                  type="button"
                  onClick={() => handleLoadSaved(s)}
                  disabled={isStreaming}
                  className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  title={`${s.platforms.length} plataformas - ${s.timeRange}`}
                >
                  <Star
                    size={13}
                    className="text-accent"
                    aria-hidden="true"
                  />
                  {s.label}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSaved(s.id)}
                  aria-label={`Eliminar busqueda ${s.label}`}
                  className="text-ink-subtle hover:text-sentiment-negative"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveCurrent}
              disabled={!query.trim() || isStreaming}
            >
              <Plus size={14} aria-hidden="true" />
              Guardar busqueda
            </Button>
          </div>
        )}
      </Card>

      {/* ---- Honestidad: estado real del backend -------------------------- */}
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-md border border-border-subtle bg-sunken p-3 text-[11px] leading-relaxed text-ink-subtle"
      >
        <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
        <p>
          Busqueda en vivo: las menciones aparecen conforme se detectan. Si por
          ahora no hay resultados, veras la lista vacia. Las menciones de la
          busqueda en vivo todavia no se guardan para consultarlas mas tarde.
        </p>
      </div>
    </div>
  )
}

export default Pulso
