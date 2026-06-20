/**
 * Pantalla "Sentimiento" (mockup 06).
 *
 * Owner: routes/dashboard/sentiment.tsx. Importa SOLO exports documentados por
 * ruta directa. Cuatro estados por panel (loading / empty / error / data),
 * responsive mobile-first, respeta prefers-reduced-motion (los componentes de
 * chart ya desactivan animacion donde aplica). REGLA 79: cero acentos / n-tilde
 * en strings visibles.
 *
 * Layout (espeja el mockup):
 *   - Filtros: scope + ventana (los unicos params reales del breakdown).
 *   - grid-2: PlatformStackedBars (FE-computed) + GlobalSentimentBar.
 *   - SentimentDonut: distribucion global 5-cat.
 *   - grid-2: SentimentEvolution (5 series incl sarcastic) + Drivers.
 *       Drivers NO tiene endpoint agregado target-aware -> empty-state honesto.
 *   - grid-2: Top menciones positivas + negativas (FE-computed sobre /mentions).
 *
 * Honestidad de datos:
 *   - GlobalSentimentBar + SentimentDonut salen de /sentiment-breakdown (real).
 *   - PlatformStackedBars + Top menciones se computan FE-side sobre las ultimas
 *     500 menciones (filtrando google_trends): NO representativo de todo el
 *     historial, por eso lleva caveat + <DemoBadge/>.
 *   - SentimentEvolution usa sentiment_breakdown por bucket de /timeseries; los
 *     buckets pueden venir vacios pre-fix B-15 -> empty-state honesto.
 */

import { useMemo, useState } from 'react'
import { Hash, MessageSquare, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react'

import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonTable } from '../../components/states/Skeleton'
import { DemoBadge } from '../../components/states/DemoBadge'

import { PlatformStackedBars } from '../../components/charts/PlatformStackedBars'
import type { PlatformSentimentRow } from '../../components/charts/PlatformStackedBars'
import { GlobalSentimentBar } from '../../components/charts/GlobalSentimentBar'
import { SentimentDonut } from '../../components/charts/SentimentDonut'
import { SentimentEvolution } from '../../components/charts/SentimentEvolution'
import type { SentimentEvolutionPoint } from '../../components/charts/SentimentEvolution'
import type { SentimentCounts } from '../../components/charts/sentimentColors'

import { useClientTheme } from '../../features/client-theme/useClientTheme'
import {
  useMentions,
  useSentimentBreakdown,
  useTimeseries,
} from '../../lib/api/queries'
import type {
  Mention,
  SentimentBreakdownCounts,
  SentimentScope,
  TimeseriesBucket,
} from '../../lib/api/types'
import { platformLabel } from '../../lib/utils/platforms'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

type WindowDays = 7 | 30 | 60 | 90

const SCOPES: Array<{ value: SentimentScope; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'third_party', label: 'Terceros' },
  { value: 'own', label: 'Propio' },
  { value: 'comments', label: 'Comentarios' },
]

const WINDOWS: Array<{ value: WindowDays; label: string }> = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
]

const SCOPE_LABEL: Record<SentimentScope, string> = {
  all: 'todos',
  third_party: 'terceros',
  own: 'propio',
  comments: 'comentarios',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeNum(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function isNotGoogleTrends(m: Mention): boolean {
  return m.platform !== 'google_trends'
}

function engagementSum(m: Mention): number {
  return Object.values(m.engagement_metrics ?? {}).reduce<number>(
    (s, v) => s + (typeof v === 'number' ? v : 0),
    0,
  )
}

/** Adapta el breakdown del backend al shape SentimentCounts de los charts. */
function toCounts(b: SentimentBreakdownCounts | undefined): SentimentCounts | null {
  if (!b) return null
  return {
    positive: safeNum(b.positive),
    negative: safeNum(b.negative),
    neutral: safeNum(b.neutral),
    mixed: safeNum(b.mixed),
    sarcastic: safeNum(b.sarcastic),
  }
}

/** Agrupa menciones por plataforma -> filas para PlatformStackedBars. */
function buildPlatformRows(mentions: Mention[]): PlatformSentimentRow[] {
  const byPlatform = new Map<string, SentimentCounts & { _total: number }>()
  for (const m of mentions) {
    if (!isNotGoogleTrends(m)) continue
    const label = m.sentiment_label
    if (!label) continue
    const cur =
      byPlatform.get(m.platform) ??
      ({
        positive: 0,
        negative: 0,
        neutral: 0,
        mixed: 0,
        sarcastic: 0,
        _total: 0,
      } as SentimentCounts & { _total: number })
    cur[label] = (cur[label] ?? 0) + 1
    cur._total += 1
    byPlatform.set(m.platform, cur)
  }
  return Array.from(byPlatform.entries())
    .map(([platform, c]) => ({
      platform: platformLabel(platform),
      counts: {
        positive: c.positive,
        negative: c.negative,
        neutral: c.neutral,
        mixed: c.mixed,
        sarcastic: c.sarcastic,
      } as SentimentCounts,
      _total: c._total,
    }))
    .sort((a, b) => b._total - a._total)
    .map(({ platform, counts }) => ({ platform, counts }))
}

// ---------------------------------------------------------------------------
// Segmented control reusable (inline; no se edita ningun archivo compartido)
// ---------------------------------------------------------------------------

function SegControl<T extends string | number>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  label: string
  ariaLabel: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-xs font-mono uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="inline-flex flex-wrap rounded-md border border-border-subtle overflow-hidden bg-sunken"
      >
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                active
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:text-ink hover:bg-card',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tarjeta de mencion (mockup .mention)
// ---------------------------------------------------------------------------

function MentionCard({
  m,
  engagement,
  tone,
}: {
  m: Mention
  engagement: number
  tone: 'positive' | 'negative'
}) {
  const score = m.sentiment_score
  const scoreStr =
    typeof score === 'number'
      ? `${score >= 0 ? '+' : ''}${score.toFixed(2)}`
      : null
  return (
    <li className="rounded-sm border border-border-subtle bg-card p-3.5">
      <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
        <span className="font-mono">{platformLabel(m.platform)}</span>
        <span aria-hidden="true">·</span>
        <span className="font-semibold text-ink-muted truncate max-w-[160px]">
          {m.author ?? '(anon)'}
        </span>
        {scoreStr ? (
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold',
              tone === 'negative'
                ? 'text-sentiment-negative bg-sentiment-negative/15'
                : 'text-sentiment-positive bg-sentiment-positive/15',
            )}
          >
            {scoreStr}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink line-clamp-3">
        {(m.content ?? '').slice(0, 280) || '(sin contenido)'}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-subtle">
        <span className="font-mono tabular-nums">
          interaccion {engagement.toLocaleString('en-US')}
        </span>
        {m.url ? (
          <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto font-mono text-primary underline underline-offset-2 hover:no-underline truncate max-w-[160px]"
          >
            ver fuente
          </a>
        ) : null}
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------

export function Sentiment() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  const [scope, setScope] = useState<SentimentScope>('all')
  const [windowDays, setWindowDays] = useState<WindowDays>(30)

  // 1. Breakdown global (real) -> GlobalSentimentBar + SentimentDonut.
  const sentQ = useSentimentBreakdown(politicianId, { scope, days: windowDays })

  // 2. Menciones (FE-compute por plataforma + top voces). 500 recientes.
  const mentionsQ = useMentions(politicianId, { limit: 500 })

  // 3. Timeseries 60d -> evolucion del sentimiento por bucket.
  const timeseriesQ = useTimeseries(politicianId, { days: 60, interval: 'day' })

  // -------------------------------------------------------------------------
  // Derivados
  // -------------------------------------------------------------------------

  const globalCounts = useMemo(
    () => toCounts(sentQ.data?.breakdown),
    [sentQ.data],
  )
  const breakdown = sentQ.data?.breakdown

  const allMentions = useMemo(
    () => (mentionsQ.data ?? []).filter(isNotGoogleTrends),
    [mentionsQ.data],
  )

  const platformRows = useMemo(
    () => buildPlatformRows(mentionsQ.data ?? []),
    [mentionsQ.data],
  )

  const evolutionData: SentimentEvolutionPoint[] = useMemo(() => {
    const buckets: TimeseriesBucket[] = timeseriesQ.data?.buckets ?? []
    return buckets.map((b) => {
      const sb = b.sentiment_breakdown ?? {}
      return {
        label: b.label ?? b.timestamp,
        positive: safeNum(sb.positive),
        negative: safeNum(sb.negative),
        neutral: safeNum(sb.neutral),
        mixed: safeNum(sb.mixed),
        // El backend no expone 'sarcastic' por bucket todavia (solo en
        // breakdown agregado) -> 0 honesto, sin inventar data.
        sarcastic: 0,
      }
    })
  }, [timeseriesQ.data])

  const hasEvolutionSignal = evolutionData.some(
    (d) => d.positive + d.negative + d.neutral + d.mixed > 0,
  )

  const topPositive = useMemo(
    () =>
      allMentions
        .filter((m) => m.sentiment_label === 'positive')
        .map((m) => ({ mention: m, engagement: engagementSum(m) }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5),
    [allMentions],
  )

  const topNegative = useMemo(
    () =>
      allMentions
        .filter((m) => m.sentiment_label === 'negative')
        .map((m) => ({ mention: m, engagement: engagementSum(m) }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5),
    [allMentions],
  )

  const windowLabel = WINDOWS.find((w) => w.value === windowDays)?.label ?? `${windowDays}d`

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page head (espeja .page-head del mockup) */}
      <header>
        <div className="text-xs font-mono uppercase tracking-wide text-ink-subtle">
          Analisis
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Sentimiento</h1>
        <p className="mt-1 text-sm text-ink-muted max-w-2xl">
          Como se siente la conversacion sobre {client.display_name}.
          Distribucion por plataforma, voces extremas y evolucion a 60 dias.
        </p>
      </header>

      {/* Filtros */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegControl
            label="Scope"
            ariaLabel="Scope de menciones"
            options={SCOPES}
            value={scope}
            onChange={setScope}
          />
          <SegControl
            label="Ventana"
            ariaLabel="Ventana de tiempo"
            options={WINDOWS}
            value={windowDays}
            onChange={setWindowDays}
          />
        </div>
      </Card>

      {/* Fila 1: distribucion por plataforma (FE) + sentimiento global (real) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative">
          <DemoBadge className="absolute right-3 top-3 z-10" />
          <PlatformStackedBars
            rows={platformRows}
            loading={mentionsQ.isLoading}
            error={mentionsQ.isError}
            onRetry={() => mentionsQ.refetch()}
            title="Distribucion por plataforma"
            hint="ultimas 500 menc."
          />
          <p className="mt-2 px-1 text-[11px] italic text-ink-subtle">
            Calculado sobre las ultimas 500 menciones (sin Google Trends). Es una
            muestra reciente, no el historial completo.
          </p>
        </div>

        <GlobalSentimentBar
          counts={globalCounts}
          loading={sentQ.isLoading}
          error={sentQ.isError}
          onRetry={() => sentQ.refetch()}
          title="Sentimiento global"
          hint={`${windowLabel} · ${SCOPE_LABEL[scope]}`}
        />
      </div>

      {/* Distribucion global 5-cat (donut, breakdown real) */}
      <section>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Hash size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Distribucion global ({windowLabel} · {SCOPE_LABEL[scope]})
          </h2>
        </div>
        <SentimentDonut
          counts={globalCounts}
          loading={sentQ.isLoading}
          error={sentQ.isError}
          onRetry={() => sentQ.refetch()}
          size={200}
          centerLabel="menciones"
          ariaLabel="Distribucion porcentual de sentimiento en 5 categorias"
        />
        {breakdown && breakdown.unprocessed > 0 ? (
          <p className="mt-2 px-1 text-[11px] italic text-ink-subtle">
            {breakdown.unprocessed.toLocaleString('en-US')} menciones sin
            sentimiento procesado en esta ventana (excluidas del grafico).
          </p>
        ) : null}
      </section>

      {/* Fila 2: evolucion (timeseries) + drivers (sin endpoint) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <TrendingUp size={16} className="text-ink-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">
              Evolucion del sentimiento
            </h2>
            <span className="ml-auto text-[11px] text-ink-subtle">
              60 dias · % por categoria
            </span>
          </div>
          {timeseriesQ.isLoading || timeseriesQ.isError || hasEvolutionSignal ? (
            <SentimentEvolution
              data={evolutionData}
              isLoading={timeseriesQ.isLoading}
              isError={timeseriesQ.isError}
              onRetry={() => timeseriesQ.refetch()}
              height={280}
              format="percent"
              ariaLabel="Evolucion del sentimiento en 60 dias por categoria"
            />
          ) : (
            <Card>
              <EmptyState
                title="Aun no hay datos para este periodo"
                description="Todavia no hay suficiente informacion para mostrar la evolucion del sentimiento en este periodo."
              />
            </Card>
          )}
          <p className="mt-2 px-1 text-[11px] italic text-ink-subtle">
            Datos diarios del periodo. La serie de sarcasmo todavia no esta
            disponible por dia.
          </p>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Hash size={16} className="text-ink-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">
              Temas que mas influyen
            </h2>
          </div>
          <Card>
            {/* API PENDIENTE: no existe endpoint de sentiment-by-topic target-aware.
                Requiere Wave B-7 (clasificacion enfocada al cliente) + B-15 (fix
                orchestrator window). El agregador de topics sigue vacio en el
                backend actual, por eso NO se monta data fake: empty-state honesto. */}
            <EmptyState
              icon={<TrendingUp size={48} strokeWidth={1.5} />}
              title="Aun no disponible"
              description="Los temas que mas influyen en el sentimiento estaran disponibles proximamente."
            />
          </Card>
        </section>
      </div>

      {/* Fila 3: top menciones positivas + negativas (FE-computed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="mb-1 flex items-center gap-2">
            <ThumbsUp
              size={16}
              className="text-sentiment-positive"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-ink">
              Top menciones positivas
            </h2>
            <DemoBadge className="ml-auto" />
          </div>
          <p className="mb-3 text-[11px] italic text-ink-subtle">
            Menciones positivas entre las 500 mas recientes, ordenadas por
            interaccion total.
          </p>
          {mentionsQ.isLoading ? (
            <SkeletonTable rows={4} cols={1} />
          ) : mentionsQ.isError ? (
            <ErrorState onRetry={() => mentionsQ.refetch()} />
          ) : topPositive.length === 0 ? (
            <EmptyState
              icon={<ThumbsUp size={48} strokeWidth={1.5} />}
              title="Sin menciones positivas"
              description="Entre las 500 menciones recientes (sin Google Trends) no hay ninguna positiva."
            />
          ) : (
            <ul className="space-y-2.5">
              {topPositive.map(({ mention, engagement }) => (
                <MentionCard
                  key={mention.id}
                  m={mention}
                  engagement={engagement}
                  tone="positive"
                />
              ))}
              <li className="flex justify-end pt-1">
                <Badge variant="positive">{topPositive.length} mostradas</Badge>
              </li>
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-1 flex items-center gap-2">
            <ThumbsDown
              size={16}
              className="text-sentiment-negative"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-ink">
              Top menciones negativas
            </h2>
            <DemoBadge className="ml-auto" />
          </div>
          <p className="mb-3 text-[11px] italic text-ink-subtle">
            Menciones negativas entre las 500 mas recientes, ordenadas por
            interaccion total.
          </p>
          {mentionsQ.isLoading ? (
            <SkeletonTable rows={4} cols={1} />
          ) : mentionsQ.isError ? (
            <ErrorState onRetry={() => mentionsQ.refetch()} />
          ) : topNegative.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={48} strokeWidth={1.5} />}
              title="Sin menciones negativas"
              description="Entre las 500 menciones recientes (sin Google Trends) no hay ninguna negativa."
            />
          ) : (
            <ul className="space-y-2.5">
              {topNegative.map(({ mention, engagement }) => (
                <MentionCard
                  key={mention.id}
                  m={mention}
                  engagement={engagement}
                  tone="negative"
                />
              ))}
              <li className="flex justify-end pt-1">
                <Badge variant="negative">{topNegative.length} mostradas</Badge>
              </li>
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Sentiment
