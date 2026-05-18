import { useMemo, useState } from 'react'
import {
  Heart,
  Layers,
  MessageSquare,
  TrendingUp,
  Hash,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { DonutChart } from '../../components/data-display/DonutChart'
import { TimeSeriesChart } from '../../components/data-display/TimeSeriesChart'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import {
  SkeletonChart,
  SkeletonTable,
} from '../../components/states/LoadingSkeleton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import {
  useMentions,
  useSentimentBreakdown,
  useTimeseries,
} from '../../lib/api/queries'
import type {
  Mention,
  SentimentLabel,
  SentimentScope,
  TimeseriesBucket,
} from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Filter constants
// ---------------------------------------------------------------------------

type WindowDays = 7 | 30 | 90

const SCOPES: Array<{ value: SentimentScope; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'third_party', label: 'Terceros' },
  { value: 'own', label: 'Propio' },
  { value: 'comments', label: 'Comentarios' },
]

const WINDOWS: Array<{ value: WindowDays; label: string }> = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: 'var(--polaris-sentiment-positive)',
  negative: 'var(--polaris-sentiment-negative)',
  neutral: 'var(--polaris-sentiment-neutral)',
  mixed: 'var(--polaris-sentiment-mixed)',
  sarcastic: 'var(--polaris-accent)',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function engagementSum(m: Mention): number {
  return Object.values(m.engagement_metrics ?? {}).reduce<number>(
    (s, v) => s + (typeof v === 'number' ? v : 0),
    0,
  )
}

function isNotGoogleTrends(m: Mention): boolean {
  return m.platform !== 'google_trends'
}

function safeNum(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

// ---------------------------------------------------------------------------
// Per-platform stacked bars (YELLOW — FE-computed)
// ---------------------------------------------------------------------------

type PlatformRow = {
  platform: string
  positive: number
  negative: number
  neutral: number
  mixed: number
  sarcastic: number
  total: number
}

function buildPlatformRows(mentions: Mention[]): PlatformRow[] {
  const byPlatform = new Map<string, PlatformRow>()
  for (const m of mentions) {
    if (!isNotGoogleTrends(m)) continue
    const key = m.platform
    const row = byPlatform.get(key) ?? {
      platform: key,
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      sarcastic: 0,
      total: 0,
    }
    const label = m.sentiment_label
    if (label === 'positive') row.positive += 1
    else if (label === 'negative') row.negative += 1
    else if (label === 'neutral') row.neutral += 1
    else if (label === 'mixed') row.mixed += 1
    else if (label === 'sarcastic') row.sarcastic += 1
    if (label) row.total += 1
    byPlatform.set(key, row)
  }
  return Array.from(byPlatform.values())
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
}

function PlatformStackedBars({ rows }: { rows: PlatformRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin distribucion por plataforma"
        description="Las ultimas 500 menciones (filtrando google_trends) no tienen sentiment_label asignado."
      />
    )
  }
  const maxTotal = Math.max(...rows.map((r) => r.total))
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const widthScale = maxTotal > 0 ? r.total / maxTotal : 0
        const segments: Array<{
          key: SentimentLabel
          count: number
        }> = [
          { key: 'positive', count: r.positive },
          { key: 'neutral', count: r.neutral },
          { key: 'mixed', count: r.mixed },
          { key: 'sarcastic', count: r.sarcastic },
          { key: 'negative', count: r.negative },
        ]
        return (
          <div key={r.platform} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-sm text-ink truncate font-mono">
              {r.platform}
            </div>
            <div
              className="flex-1 h-5 rounded-md overflow-hidden bg-surface flex"
              style={{ width: `${widthScale * 100}%`, minWidth: '60px' }}
              role="img"
              aria-label={`Distribucion sentimiento ${r.platform}: ${r.positive} positivas, ${r.negative} negativas, ${r.neutral} neutrales, ${r.mixed} mixtas, ${r.sarcastic} sarcasticas`}
            >
              {segments.map((seg) => {
                if (seg.count === 0) return null
                const pct = (seg.count / r.total) * 100
                return (
                  <div
                    key={seg.key}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SENTIMENT_COLORS[seg.key],
                    }}
                    title={`${seg.key}: ${seg.count} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>
            <div className="w-16 text-right shrink-0 font-mono text-xs text-ink-muted tabular-nums">
              {r.total}
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-3 text-xs text-ink-muted pt-2 border-t border-border">
        {(['positive', 'neutral', 'mixed', 'sarcastic', 'negative'] as const).map(
          (k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: SENTIMENT_COLORS[k] }}
                aria-hidden="true"
              />
              <span className="capitalize">{k}</span>
            </span>
          ),
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top mention card
// ---------------------------------------------------------------------------

function MentionCard({
  m,
  engagement,
}: {
  m: Mention
  engagement: number
}) {
  return (
    <li className="border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div className="text-xs text-ink-muted font-mono flex items-center gap-2 flex-wrap">
        <span>{m.platform}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate max-w-[180px]">{m.author ?? '(anon)'}</span>
        <span aria-hidden="true">·</span>
        <span>
          engagement{' '}
          <span className="tabular-nums">{engagement.toLocaleString('es-MX')}</span>
        </span>
        {typeof m.sentiment_score === 'number' ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              score {m.sentiment_score.toFixed(2)}
            </span>
          </>
        ) : null}
      </div>
      <div className="text-sm text-ink line-clamp-3 mt-1">
        {(m.content ?? '').slice(0, 280) || '(sin contenido)'}
      </div>
      {m.url ? (
        <a
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-primary underline underline-offset-2 hover:no-underline mt-1 inline-block truncate max-w-full"
        >
          {m.url}
        </a>
      ) : null}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Sentimiento detallado route
// ---------------------------------------------------------------------------

export function Sentiment() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  const [scope, setScope] = useState<SentimentScope>('all')
  const [windowDays, setWindowDays] = useState<WindowDays>(30)

  // 1. Global breakdown (GREEN)
  const sentQ = useSentimentBreakdown(politicianId, {
    scope,
    days: windowDays,
  })

  // 2. Per-platform: pull 500 mentions, FE-compute
  const mentionsQ = useMentions(politicianId, { limit: 500 })

  // 3. Timeseries 60d for global sentiment evolution
  const timeseriesQ = useTimeseries(politicianId, {
    days: 60,
    interval: 'day',
  })

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const sentPct = sentQ.data?.breakdown?.pct
  const sentTotal = sentQ.data?.breakdown?.total ?? 0
  const sentCounts = sentQ.data?.breakdown
  const donutData = sentPct
    ? [
        {
          name: 'Positivo',
          value: sentPct.positive,
          color: SENTIMENT_COLORS.positive,
        },
        {
          name: 'Negativo',
          value: sentPct.negative,
          color: SENTIMENT_COLORS.negative,
        },
        {
          name: 'Neutral',
          value: sentPct.neutral,
          color: SENTIMENT_COLORS.neutral,
        },
        {
          name: 'Mixto',
          value: sentPct.mixed,
          color: SENTIMENT_COLORS.mixed,
        },
        {
          name: 'Sarcastico',
          value: sentPct.sarcastic,
          color: SENTIMENT_COLORS.sarcastic,
        },
      ]
    : []

  const allMentions = useMemo(
    () =>
      (mentionsQ.data ?? []).filter(isNotGoogleTrends),
    [mentionsQ.data],
  )

  const platformRows = useMemo(
    () => buildPlatformRows(mentionsQ.data ?? []),
    [mentionsQ.data],
  )

  const buckets: TimeseriesBucket[] = timeseriesQ.data?.buckets ?? []
  const timeseriesData = buckets.map((b) => {
    const sb = b.sentiment_breakdown ?? {}
    return {
      date: b.label ?? b.timestamp,
      positivo: safeNum(sb.positive),
      negativo: safeNum(sb.negative),
      neutral: safeNum(sb.neutral),
      mixto: safeNum(sb.mixed),
    }
  })
  const hasTimeseriesSignal = timeseriesData.some(
    (d) => d.positivo + d.negativo + d.neutral + d.mixto > 0,
  )

  const topPositive = useMemo(() => {
    return allMentions
      .filter((m) => m.sentiment_label === 'positive')
      .map((m) => ({ mention: m, engagement: engagementSum(m) }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
  }, [allMentions])

  const topNegative = useMemo(() => {
    return allMentions
      .filter((m) => m.sentiment_label === 'negative')
      .map((m) => ({ mention: m, engagement: engagementSum(m) }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
  }, [allMentions])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Sentimiento detallado"
        subtitle="Distribucion + evolucion + voces extremas"
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

      {/* Section 1: Distribucion global 5-cat (GREEN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-ink-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">
              Distribucion global ({windowDays}d · {scope})
            </h2>
          </div>
          {sentQ.isLoading ? (
            <SkeletonChart />
          ) : sentQ.isError ? (
            <ErrorState onRetry={() => sentQ.refetch()} />
          ) : sentTotal === 0 || donutData.length === 0 ? (
            <EmptyState
              title="Sin sentimiento procesado"
              description="No hay menciones con label de sentimiento en la ventana seleccionada."
            />
          ) : (
            <DonutChart
              data={donutData}
              height={280}
              centerLabel="Menciones"
              centerValue={sentTotal.toLocaleString('es-MX')}
              ariaLabel="Distribucion porcentual de sentimiento en 5 categorias"
            />
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink mb-3">
            Conteo por categoria
          </h3>
          {sentQ.isLoading ? (
            <SkeletonTable rows={5} />
          ) : sentQ.isError || !sentCounts ? (
            <EmptyState
              title="Sin conteos"
              description="No hay datos para esta ventana."
            />
          ) : (
            <ul className="space-y-2">
              {(
                [
                  ['positive', 'Positivo', sentCounts.positive, sentCounts.pct.positive],
                  ['negative', 'Negativo', sentCounts.negative, sentCounts.pct.negative],
                  ['neutral', 'Neutral', sentCounts.neutral, sentCounts.pct.neutral],
                  ['mixed', 'Mixto', sentCounts.mixed, sentCounts.pct.mixed],
                  ['sarcastic', 'Sarcastico', sentCounts.sarcastic, sentCounts.pct.sarcastic],
                ] as Array<[SentimentLabel, string, number, number]>
              ).map(([k, label, count, pct]) => (
                <li
                  key={k}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: SENTIMENT_COLORS[k] }}
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                  <span className="font-mono text-xs text-ink-muted tabular-nums">
                    <span className="text-ink">{count.toLocaleString('es-MX')}</span>{' '}
                    ({pct.toFixed(1)}%)
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between pt-1 text-xs text-ink-subtle italic">
                <span>Sin procesar</span>
                <span className="font-mono tabular-nums">
                  {sentCounts.unprocessed.toLocaleString('es-MX')}
                </span>
              </li>
            </ul>
          )}
        </Card>
      </div>

      {/* Section 2: Distribucion por plataforma (YELLOW FE-computed) */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Hash size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Distribucion por plataforma
          </h2>
        </div>
        <p className="text-xs text-ink-muted italic mb-3">
          Computado FE-side desde las ultimas 500 menciones (filtrando
          google_trends). No representativo de todo el historial — el backend no
          expone un endpoint sentiment-by-platform agregado.
        </p>
        {mentionsQ.isLoading ? (
          <SkeletonChart />
        ) : mentionsQ.isError ? (
          <ErrorState onRetry={() => mentionsQ.refetch()} />
        ) : (
          <PlatformStackedBars rows={platformRows} />
        )}
      </Card>

      {/* Section 3: Evolucion 60d sentiment global (YELLOW caveat B-15) */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Evolucion 60d sentimiento global
          </h2>
        </div>
        <p className="text-xs text-ink-muted italic mb-3">
          Buckets diarios desde timeseries (sentiment_breakdown por bucket).
          Wave B fix B-15 pendiente — ~95% de buckets pueden estar vacios
          pre-fix.
        </p>
        {timeseriesQ.isLoading ? (
          <SkeletonChart />
        ) : timeseriesQ.isError ? (
          <ErrorState onRetry={() => timeseriesQ.refetch()} />
        ) : !hasTimeseriesSignal ? (
          <EmptyState
            title="Sin senal en buckets"
            description="Los buckets de timeseries no tienen sentiment_breakdown poblado. Pendiente Wave B fix B-15."
          />
        ) : (
          <TimeSeriesChart
            data={timeseriesData}
            series={[
              {
                key: 'positivo',
                label: 'Positivo',
                color: SENTIMENT_COLORS.positive,
              },
              {
                key: 'negativo',
                label: 'Negativo',
                color: SENTIMENT_COLORS.negative,
              },
              {
                key: 'neutral',
                label: 'Neutral',
                color: SENTIMENT_COLORS.neutral,
              },
              {
                key: 'mixto',
                label: 'Mixto',
                color: SENTIMENT_COLORS.mixed,
              },
            ]}
            height={260}
            ariaLabel="Evolucion del sentimiento global en 60 dias por categoria"
          />
        )}
      </Card>

      {/* Section 4: Drivers (RED — Wave B-7 + B-15) */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Hash size={16} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">
            Drivers de sentimiento (topics que pesan negativo)
          </h2>
        </div>
        <EmptyState
          title="Pendiente Wave B"
          description="Sentiment-by-topic target-aware requiere Wave B-7 (clasificacion enfocada al cliente) + Wave B-15 (fix orchestrator window). Topics agregador sigue vacio en backend actual."
        />
      </Card>

      {/* Section 5+6: Top 5 menciones positivas + negativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <ThumbsUp size={16} className="text-sentiment-positive" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">
              Top 5 menciones positivas
            </h2>
          </div>
          <p className="text-xs text-ink-muted italic mb-3">
            Filtrado sentiment_label='positive' sobre 500 menciones recientes,
            ordenado por engagement total.
          </p>
          {mentionsQ.isLoading ? (
            <SkeletonTable rows={5} />
          ) : mentionsQ.isError ? (
            <ErrorState onRetry={() => mentionsQ.refetch()} />
          ) : topPositive.length === 0 ? (
            <EmptyState
              icon={<Heart size={48} strokeWidth={1.5} />}
              title="Sin menciones positivas"
              description="Las 500 menciones recientes (filtrando google_trends) no incluyen ninguna marcada como 'positive'."
            />
          ) : (
            <ul className="space-y-3">
              {topPositive.map(({ mention, engagement }) => (
                <MentionCard
                  key={mention.id}
                  m={mention}
                  engagement={engagement}
                />
              ))}
              <li className="pt-2 flex justify-end">
                <Badge variant="positive">
                  {topPositive.length} mostradas
                </Badge>
              </li>
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-1">
            <ThumbsDown size={16} className="text-sentiment-negative" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">
              Top 5 menciones negativas
            </h2>
          </div>
          <p className="text-xs text-ink-muted italic mb-3">
            Filtrado sentiment_label='negative' sobre 500 menciones recientes,
            ordenado por engagement total.
          </p>
          {mentionsQ.isLoading ? (
            <SkeletonTable rows={5} />
          ) : mentionsQ.isError ? (
            <ErrorState onRetry={() => mentionsQ.refetch()} />
          ) : topNegative.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={48} strokeWidth={1.5} />}
              title="Sin menciones negativas"
              description="Las 500 menciones recientes (filtrando google_trends) no incluyen ninguna marcada como 'negative'."
            />
          ) : (
            <ul className="space-y-3">
              {topNegative.map(({ mention, engagement }) => (
                <MentionCard
                  key={mention.id}
                  m={mention}
                  engagement={engagement}
                />
              ))}
              <li className="pt-2 flex justify-end">
                <Badge variant="negative">
                  {topNegative.length} mostradas
                </Badge>
              </li>
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Sentiment
