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
  BookmarkPlus,
  ExternalLink,
  Loader2,
  Search,
  Square,
  X,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PlatformChip } from '../../components/data-display/PlatformChip'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { ENDPOINTS } from '../../lib/api/endpoints'
import { streamPost, type SseEvent } from '../../lib/api/sse'
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
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env
  return (env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
}

const PLATFORM_CHOICES: { id: string; label: string; defaultOn: boolean }[] = [
  { id: 'twitter', label: 'Twitter', defaultOn: true },
  { id: 'bluesky', label: 'Bluesky', defaultOn: true },
  { id: 'instagram', label: 'Instagram', defaultOn: true },
  { id: 'tiktok', label: 'TikTok', defaultOn: true },
  { id: 'youtube', label: 'YouTube', defaultOn: true },
  { id: 'news_mx', label: 'News MX', defaultOn: true },
  { id: 'gdelt', label: 'GDELT', defaultOn: true },
  { id: 'google_trends', label: 'Google Trends', defaultOn: false },
]

const TIME_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: '1h', label: 'Ultima hora' },
  { value: '24h', label: 'Ultimas 24 horas' },
  { value: '7d', label: 'Ultimos 7 dias' },
]

const SAVED_SEARCHES_KEY = 'polaris_saved_searches'
const CAVEAT_DISMISSED_KEY = 'polaris_pulso_caveat_dismissed_v1'

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

type StreamSummary = {
  total: number
  byPlatform: Record<string, number>
  bySentiment: Record<string, number>
  topAuthors: { handle: string; count: number }[]
}

type StreamState = {
  status: 'idle' | 'connecting' | 'streaming' | 'closed' | 'error' | 'aborted'
  mentions: Mention[]
  progressMsg: string
  errorMsg: string | null
  startedAt: number | null
  endedAt: number | null
  summary: StreamSummary | null
}

type StreamAction =
  | { type: 'start' }
  | { type: 'progress'; message: string }
  | { type: 'mention'; mention: Mention }
  | { type: 'summary'; summary: StreamSummary }
  | { type: 'done' }
  | { type: 'error'; message: string }
  | { type: 'abort' }
  | { type: 'reset' }

const initialStreamState: StreamState = {
  status: 'idle',
  mentions: [],
  progressMsg: '',
  errorMsg: null,
  startedAt: null,
  endedAt: null,
  summary: null,
}

function streamReducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case 'reset':
      return initialStreamState
    case 'start':
      return {
        ...initialStreamState,
        status: 'connecting',
        progressMsg: 'Conectando al stream...',
        startedAt: Date.now(),
      }
    case 'progress':
      return {
        ...state,
        status: state.status === 'connecting' ? 'streaming' : state.status,
        progressMsg: action.message,
      }
    case 'mention': {
      // Dedupe by id (some backends echo the same mention across plataformas).
      if (state.mentions.some((m) => m.id === action.mention.id)) {
        return state
      }
      return {
        ...state,
        status: 'streaming',
        mentions: [action.mention, ...state.mentions],
      }
    }
    case 'summary':
      return { ...state, summary: action.summary }
    case 'done':
      return {
        ...state,
        status: 'closed',
        progressMsg: 'Stream completado',
        endedAt: Date.now(),
      }
    case 'error':
      return {
        ...state,
        status: 'error',
        errorMsg: action.message,
        endedAt: Date.now(),
      }
    case 'abort':
      return {
        ...state,
        status: 'aborted',
        progressMsg: 'Cancelado por el usuario',
        endedAt: Date.now(),
      }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sentimentBadgeVariant(
  label: SentimentLabel | null | undefined,
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
    // Quota / private mode — silently noop.
  }
}

function isMention(value: unknown): value is Mention {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.platform === 'string' &&
    typeof v.content === 'string'
  )
}

function deriveSummary(mentions: Mention[]): StreamSummary {
  const byPlatform: Record<string, number> = {}
  const bySentiment: Record<string, number> = {}
  const authorCounts: Record<string, number> = {}
  for (const m of mentions) {
    byPlatform[m.platform] = (byPlatform[m.platform] ?? 0) + 1
    const s = m.sentiment_label ?? 'unprocessed'
    bySentiment[s] = (bySentiment[s] ?? 0) + 1
    const handle = m.author_handle ?? m.author ?? null
    if (handle) {
      authorCounts[handle] = (authorCounts[handle] ?? 0) + 1
    }
  }
  const topAuthors = Object.entries(authorCounts)
    .map(([handle, count]) => ({ handle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  return {
    total: mentions.length,
    byPlatform,
    bySentiment,
    topAuthors,
  }
}

// ---------------------------------------------------------------------------
// Inline MentionCard (lightweight — table card pattern is in fuentes.tsx)
// ---------------------------------------------------------------------------

function MentionCard({ mention }: { mention: Mention }) {
  return (
    <Card padded className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PlatformChip platform={mention.platform} />
          <span className="font-mono text-xs text-ink-muted truncate">
            {mention.author_handle ?? mention.author ?? 'desconocido'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={sentimentBadgeVariant(mention.sentiment_label)}>
            {sentimentLabel(mention.sentiment_label)}
          </Badge>
          <span className="text-[10px] font-mono text-ink-subtle">
            {formatRelativeTime(mention.collected_at)}
          </span>
        </div>
      </div>
      {mention.title ? (
        <div className="text-sm font-semibold text-ink">
          {truncate(mention.title, 140)}
        </div>
      ) : null}
      <div className="text-sm text-ink-muted leading-snug">
        {truncate(mention.content, 280)}
      </div>
      {mention.url ? (
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted hover:text-ink"
        >
          Ver fuente
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      ) : null}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Caveat banner (Wave B-1 honestidad)
// ---------------------------------------------------------------------------

function CaveatBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 p-3"
    >
      <AlertCircle
        size={18}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
      />
      <div className="flex-1 min-w-0 text-sm text-amber-900 dark:text-amber-100 leading-snug">
        <div className="font-semibold mb-0.5">
          Endpoint Live Query bloqueado por bug Wave B-1
        </div>
        <p>
          La interfaz funciona, pero el stream devuelve{' '}
          <strong className="font-mono">0 mentions</strong> hasta que Wave B CC
          arregle el dispatch bug (
          <code className="font-mono">getattr(mod, "run_query", None)</code>{' '}
          aplicado a modulo en lugar de clase) y los nombres de clase
          (<code className="font-mono">SentimentMxAgent</code> →{' '}
          <code className="font-mono">SentimentMXAgent</code>) en el backend.
          Pulso en vivo se activa post-fix. Ver{' '}
          <code className="font-mono">
            /audits/2026-05-18-WAVE-B-HANDOFF-URGENT.md
          </code>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
        aria-label="Ocultar aviso"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pulso en vivo page
// ---------------------------------------------------------------------------

export function Pulso() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  // ---------- Caveat dismissal ----------
  const [caveatDismissed, setCaveatDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CAVEAT_DISMISSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const dismissCaveat = useCallback(() => {
    setCaveatDismissed(true)
    try {
      localStorage.setItem(CAVEAT_DISMISSED_KEY, '1')
    } catch {
      // ignore
    }
  }, [])

  // ---------- Search form state ----------
  const [query, setQuery] = useState('')
  const [platforms, setPlatforms] = useState<Set<string>>(
    () => new Set(PLATFORM_CHOICES.filter((p) => p.defaultOn).map((p) => p.id)),
  )
  const [timeRange, setTimeRange] = useState<string>('24h')

  // ---------- Saved searches ----------
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    safeReadSavedSearches(),
  )
  const [savedDropdownOpen, setSavedDropdownOpen] = useState(false)

  const persistAndSet = useCallback((rows: SavedSearch[]) => {
    setSavedSearches(rows)
    persistSavedSearches(rows)
  }, [])

  const handleSaveCurrent = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    const label = trimmed.length > 40 ? trimmed.slice(0, 40) + '...' : trimmed
    const newItem: SavedSearch = {
      id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      query: trimmed,
      platforms: Array.from(platforms),
      timeRange,
      savedAt: Date.now(),
    }
    persistAndSet([newItem, ...savedSearches].slice(0, 20))
  }, [query, platforms, timeRange, savedSearches, persistAndSet])

  const handleLoadSaved = useCallback(
    (s: SavedSearch) => {
      setQuery(s.query)
      setPlatforms(new Set(s.platforms))
      setTimeRange(s.timeRange)
      setSavedDropdownOpen(false)
    },
    [],
  )

  const handleDeleteSaved = useCallback(
    (id: string) => {
      persistAndSet(savedSearches.filter((s) => s.id !== id))
    },
    [savedSearches, persistAndSet],
  )

  // ---------- Stream state ----------
  const [stream, dispatch] = useReducer(streamReducer, initialStreamState)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-derive summary from accumulated mentions when stream closes.
  useEffect(() => {
    if (stream.status === 'closed' || stream.status === 'aborted') {
      if (!stream.summary) {
        dispatch({ type: 'summary', summary: deriveSummary(stream.mentions) })
      }
    }
  }, [stream.status, stream.mentions, stream.summary])

  const isStreaming =
    stream.status === 'connecting' || stream.status === 'streaming'

  // ---------- Submit ----------
  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed || isStreaming || !politicianId) return

    // Abort any leftover stream first.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    dispatch({ type: 'start' })

    const url = `${getApiBase()}${ENDPOINTS.liveQuery}`
    const body = {
      politician_id: politicianId,
      question: trimmed,
      context: {
        platforms: Array.from(platforms),
        time_range: timeRange,
      },
    }

    await streamPost(
      url,
      body,
      {
        onEvent: (e: SseEvent) => {
          // Backend SSE event taxonomy is best-effort — we accept several
          // shapes and degrade gracefully.
          const data = e.data
          switch (e.event) {
            case 'mention':
            case 'message':
              if (isMention(data)) {
                dispatch({ type: 'mention', mention: data })
              } else if (
                typeof data === 'object' &&
                data !== null &&
                isMention((data as { mention?: unknown }).mention)
              ) {
                dispatch({
                  type: 'mention',
                  mention: (data as { mention: Mention }).mention,
                })
              } else if (typeof data === 'string') {
                dispatch({ type: 'progress', message: data })
              }
              break
            case 'progress':
            case 'status':
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
            case 'summary':
            case 'done':
              if (
                typeof data === 'object' &&
                data !== null &&
                typeof (data as { total?: unknown }).total === 'number'
              ) {
                const d = data as Partial<StreamSummary>
                dispatch({
                  type: 'summary',
                  summary: {
                    total: d.total ?? 0,
                    byPlatform: d.byPlatform ?? {},
                    bySentiment: d.bySentiment ?? {},
                    topAuthors: d.topAuthors ?? [],
                  },
                })
              }
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
                      : 'Error en el stream',
              })
              break
            default:
              // Unknown event — surface as progress message for debugging.
              if (typeof data === 'string') {
                dispatch({ type: 'progress', message: `[${e.event}] ${data}` })
              }
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
          // Only fire `done` if we haven't already errored or aborted.
          // Reading state from a reducer ref isn't great here; we rely on the
          // reducer to ignore `done` if it's already in a terminal state.
          // Simpler: dispatch a no-op-safe action.
          // (The reducer treats `done` as setting status=closed unconditionally
          // — that's acceptable because onClose fires exactly once per stream.)
        },
      },
      controller.signal,
    )

    // After streamPost resolves, transition based on whether we aborted.
    if (controller.signal.aborted) {
      // 'abort' was already dispatched by the cancel button handler.
      return
    }
    // If no error was dispatched mid-stream, this is a successful close.
    dispatch({ type: 'done' })
  }, [query, isStreaming, politicianId, platforms, timeRange])

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    dispatch({ type: 'abort' })
  }, [])

  const handleReset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: 'reset' })
  }, [])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // ---------- Derived sentiment percentages for progress bar ----------
  const sentimentPct = useMemo(() => {
    const total = stream.mentions.length
    if (total === 0) {
      return { positive: 0, negative: 0, neutral: 0, mixed: 0, unprocessed: 0 }
    }
    const counts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      unprocessed: 0,
    }
    for (const m of stream.mentions) {
      const lbl = m.sentiment_label
      if (lbl === 'positive') counts.positive++
      else if (lbl === 'negative') counts.negative++
      else if (lbl === 'neutral') counts.neutral++
      else if (lbl === 'mixed' || lbl === 'sarcastic') counts.mixed++
      else counts.unprocessed++
    }
    return {
      positive: (counts.positive / total) * 100,
      negative: (counts.negative / total) * 100,
      neutral: (counts.neutral / total) * 100,
      mixed: (counts.mixed / total) * 100,
      unprocessed: (counts.unprocessed / total) * 100,
    }
  }, [stream.mentions])

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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Pulso en vivo"
        subtitle="Busqueda real-time con SSE stream + persistencia (Wave B-1)"
      />

      {!caveatDismissed ? <CaveatBanner onDismiss={dismissCaveat} /> : null}

      {/* ---- Search panel ------------------------------------------------- */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="pulso-query"
            className="block text-[10px] font-mono uppercase tracking-wide text-ink-subtle"
          >
            Buscar en tiempo real
          </label>
          <div className="flex gap-2">
            <Input
              id="pulso-query"
              type="search"
              placeholder="Ej: corrupcion, AMLO, INE, marcha 2026..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) handleSubmit()
              }}
              disabled={isStreaming}
              className="flex-1"
            />
            {isStreaming ? (
              <Button
                variant="secondary"
                onClick={handleCancel}
                aria-label="Cancelar stream"
              >
                <Square size={14} aria-hidden="true" />
                Cancelar
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                <Search size={14} aria-hidden="true" />
                Buscar (SSE)
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1">
              Plataformas
            </div>
            <div className="flex flex-wrap gap-1.5">
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
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide border transition-colors',
                      active
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-elevated text-ink border-border hover:bg-black/[0.04] dark:hover:bg-white/[0.04]',
                      isStreaming && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="pulso-range"
              className="block text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1"
            >
              Rango temporal
            </label>
            <select
              id="pulso-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              disabled={isStreaming}
              className="bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary h-10 disabled:opacity-50"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-border">
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSavedDropdownOpen((s) => !s)}
              disabled={savedSearches.length === 0}
              aria-haspopup="listbox"
              aria-expanded={savedDropdownOpen}
            >
              Busquedas guardadas ({savedSearches.length})
            </Button>
            {savedDropdownOpen && savedSearches.length > 0 ? (
              <div
                role="listbox"
                className="absolute z-10 mt-1 w-72 max-h-72 overflow-auto bg-surface-elevated border border-border rounded-md shadow-lg"
              >
                {savedSearches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border-b border-border last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadSaved(s)}
                      className="flex-1 text-left text-sm text-ink truncate"
                    >
                      <div className="truncate">{s.label}</div>
                      <div className="text-[10px] font-mono text-ink-subtle">
                        {s.platforms.length} plataformas - {s.timeRange}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(s.id)}
                      aria-label="Eliminar busqueda guardada"
                      className="text-ink-subtle hover:text-sentiment-negative shrink-0"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveCurrent}
            disabled={!query.trim() || isStreaming}
          >
            <BookmarkPlus size={14} aria-hidden="true" />
            Guardar busqueda actual
          </Button>
        </div>
      </Card>

      {/* ---- Live progress + sentiment bar -------------------------------- */}
      {stream.status !== 'idle' ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isStreaming ? (
                <Loader2
                  size={14}
                  className="animate-spin text-primary shrink-0"
                  aria-hidden="true"
                />
              ) : null}
              <span className="text-sm font-mono text-ink truncate">
                {stream.progressMsg || 'Procesando...'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="default">
                {stream.mentions.length} mentions
              </Badge>
              {stream.status === 'error' ? (
                <Badge variant="negative">Error</Badge>
              ) : stream.status === 'aborted' ? (
                <Badge variant="default">Cancelado</Badge>
              ) : stream.status === 'closed' ? (
                <Badge variant="positive">Completado</Badge>
              ) : (
                <Badge variant="accent">En vivo</Badge>
              )}
              {!isStreaming ? (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Limpiar
                </Button>
              ) : null}
            </div>
          </div>

          {stream.errorMsg ? (
            <div className="text-xs font-mono text-sentiment-negative">
              {stream.errorMsg}
            </div>
          ) : null}

          {/* Sentiment progress bar — segmented, animated via Tailwind transition */}
          {stream.mentions.length > 0 ? (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1">
                Distribucion de sentimiento (live)
              </div>
              <div
                className="flex h-3 w-full overflow-hidden rounded-full bg-border"
                role="img"
                aria-label="Distribucion de sentimiento en vivo"
              >
                <div
                  className="bg-sentiment-positive transition-[width] duration-300"
                  style={{ width: `${sentimentPct.positive}%` }}
                  title={`Positivo ${sentimentPct.positive.toFixed(1)}%`}
                />
                <div
                  className="bg-sentiment-neutral transition-[width] duration-300"
                  style={{ width: `${sentimentPct.neutral}%` }}
                  title={`Neutral ${sentimentPct.neutral.toFixed(1)}%`}
                />
                <div
                  className="bg-sentiment-mixed transition-[width] duration-300"
                  style={{ width: `${sentimentPct.mixed}%` }}
                  title={`Mixto ${sentimentPct.mixed.toFixed(1)}%`}
                />
                <div
                  className="bg-sentiment-negative transition-[width] duration-300"
                  style={{ width: `${sentimentPct.negative}%` }}
                  title={`Negativo ${sentimentPct.negative.toFixed(1)}%`}
                />
                <div
                  className="bg-ink-subtle/40 transition-[width] duration-300"
                  style={{ width: `${sentimentPct.unprocessed}%` }}
                  title={`Sin clasificar ${sentimentPct.unprocessed.toFixed(1)}%`}
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono text-ink-muted tabular-nums">
                <span className="text-sentiment-positive">
                  + {sentimentPct.positive.toFixed(0)}%
                </span>
                <span className="text-sentiment-neutral">
                  = {sentimentPct.neutral.toFixed(0)}%
                </span>
                <span className="text-sentiment-mixed">
                  ~ {sentimentPct.mixed.toFixed(0)}%
                </span>
                <span className="text-sentiment-negative">
                  - {sentimentPct.negative.toFixed(0)}%
                </span>
                <span className="text-ink-subtle">
                  ? {sentimentPct.unprocessed.toFixed(0)}%
                </span>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* ---- Live feed (streaming mentions) ------------------------------- */}
      {stream.mentions.length > 0 ? (
        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle">
            Feed en vivo - {stream.mentions.length} mentions
          </div>
          <div className="space-y-2">
            {stream.mentions.map((m) => (
              <MentionCard key={m.id} mention={m} />
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- Summary card (post-stream) ----------------------------------- */}
      {(stream.status === 'closed' || stream.status === 'aborted') &&
      stream.summary ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              Resumen del stream
            </h2>
            <Badge variant="default">
              {formatNumber(stream.summary.total)} mentions
            </Badge>
          </div>

          {stream.summary.total === 0 ? (
            <p className="text-xs font-mono text-ink-muted">
              El backend no devolvio mentions. Esto es esperado mientras Wave
              B-1 esta bloqueada (ver banner arriba).
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1">
                  Plataformas
                </div>
                <div className="space-y-1">
                  {Object.entries(stream.summary.byPlatform)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([p, count]) => (
                      <div
                        key={p}
                        className="flex items-center justify-between gap-2 text-xs font-mono"
                      >
                        <span className="text-ink-muted truncate">
                          {platformLabel(p)}
                        </span>
                        <span className="text-ink tabular-nums">
                          {formatNumber(count)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1">
                  Sentimiento
                </div>
                <div className="space-y-1">
                  {Object.entries(stream.summary.bySentiment)
                    .sort((a, b) => b[1] - a[1])
                    .map(([s, count]) => (
                      <div
                        key={s}
                        className="flex items-center justify-between gap-2 text-xs font-mono"
                      >
                        <span className="text-ink-muted">
                          {sentimentLabel(s as SentimentLabel)}
                        </span>
                        <span className="text-ink tabular-nums">
                          {formatNumber(count)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {stream.summary.topAuthors.length > 0 ? (
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-1">
                    Top autores
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stream.summary.topAuthors.map((a) => (
                      <Badge key={a.handle} variant="default">
                        <span className="font-mono">{a.handle}</span>
                        <span className="text-ink-subtle ml-1">
                          x{a.count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] text-ink-subtle">
              <strong className="font-mono">Topics:</strong> requiere
              integracion con classifier (Track 2 pendiente).{' '}
              <strong className="font-mono">Persistencia:</strong> Wave B-1
              activara guardado en DB — actualmente mentions se descartan al
              cerrar.{' '}
              <a
                href="#/fuentes"
                className="font-mono underline underline-offset-2 hover:text-ink"
              >
                Ver detalle de cada mention en Fuentes
              </a>
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export default Pulso
