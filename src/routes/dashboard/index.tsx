import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Clock,
  Hash,
  MessageSquare,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/data-display/KPICard'
import { TimeSeriesChart } from '../../components/data-display/TimeSeriesChart'
import { DonutChart } from '../../components/data-display/DonutChart'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import {
  SkeletonChart,
  SkeletonTable,
} from '../../components/states/LoadingSkeleton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import {
  useAlerts,
  useFreshness,
  useMentions,
  usePPI,
  useSentimentBreakdown,
  useTimeseries,
  useTopAuthors,
  useTopics,
} from '../../lib/api/queries'
import type { Alert, Freshness, TimeseriesBucket } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Helpers — safe extraction from the loose PPI shape (Record<string, unknown>)
// ---------------------------------------------------------------------------

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function extractPPIScore(ppi: unknown): number | null {
  const obj = asRecord(ppi)
  if (!obj) return numOrNull(ppi)
  return numOrNull(obj.ppi_score) ?? numOrNull(obj.score)
}

function extractPPIComponent(ppi: unknown, key: string): number | null {
  const obj = asRecord(ppi)
  const components = asRecord(obj?.components)
  return numOrNull(components?.[key])
}

function extractSov(sov: unknown): number | null {
  if (typeof sov === 'number') return sov
  const obj = asRecord(sov)
  return numOrNull(obj?.sov_24h) ?? numOrNull(obj?.value)
}

// ---------------------------------------------------------------------------
// FreshnessBadge
// ---------------------------------------------------------------------------

function FreshnessBadge({ data }: { data: Freshness | undefined }) {
  if (!data) {
    return (
      <Badge variant="neutral" className="gap-1.5">
        <Clock size={12} aria-hidden="true" />
        <span>Cargando freshness</span>
      </Badge>
    )
  }
  const hours = data.hours_since_collection
  const status = data.status
  const variant =
    status === 'fresh' ? 'positive' : status === 'stale' ? 'mixed' : 'negative'
  const label =
    hours === null || hours === undefined
      ? `Sin colecta · ${status}`
      : hours < 1
        ? `Actualizado hace <1h · ${status}`
        : `Actualizado hace ${Math.round(hours)}h · ${status}`
  return (
    <Badge variant={variant} className="gap-1.5">
      <Clock size={12} aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// AlertsBanner — top of page; only renders when alerts > 0
// ---------------------------------------------------------------------------

function severityRank(s: Alert['severity']): number {
  switch (s) {
    case 'critical':
      return 4
    case 'warning':
      return 3
    case 'watch':
      return 2
    case 'info':
      return 1
    default:
      return 0
  }
}

function severityClass(s: Alert['severity']): string {
  switch (s) {
    case 'critical':
    case 'warning':
      return 'border-sentiment-negative/50 bg-sentiment-negative/10 text-sentiment-negative'
    case 'watch':
      return 'border-sentiment-mixed/50 bg-sentiment-mixed/10 text-sentiment-mixed'
    case 'info':
    default:
      return 'border-border bg-surface-elevated text-ink'
  }
}

function AlertsBanner({ alerts }: { alerts: Alert[] }) {
  const active = alerts.filter((a) => !a.is_resolved)
  if (active.length === 0) return null
  const sorted = [...active].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity),
  )
  const top = sorted[0]!
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        severityClass(top.severity),
      )}
    >
      <Bell size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide">
          <span>{active.length} alerta{active.length === 1 ? '' : 's'} activa{active.length === 1 ? '' : 's'}</span>
          <span aria-hidden="true">·</span>
          <span>{top.severity}</span>
        </div>
        <div className="mt-0.5 font-medium text-ink truncate">{top.title}</div>
        {top.description ? (
          <div className="text-sm text-ink-muted line-clamp-2">{top.description}</div>
        ) : null}
      </div>
      <Link
        to="/dashboard/alertas"
        className="shrink-0 self-center text-xs font-mono underline underline-offset-2 hover:no-underline"
      >
        Ver todas
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista General
// ---------------------------------------------------------------------------

export function VistaGeneral() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id
  const displayName = client.display_name

  const ppiQ = usePPI(politicianId)
  const sentQ = useSentimentBreakdown(politicianId, { scope: 'all', days: 30 })
  const topAuthorsQ = useTopAuthors(politicianId, {
    limit: 20,
    days: 30,
    scope: 'third_party',
  })
  const alertsQ = useAlerts(politicianId)
  const freshnessQ = useFreshness(politicianId)
  const timeseriesQ = useTimeseries(politicianId, { days: 60, interval: 'day' })
  const topicsQ = useTopics(politicianId, { days: 30 })
  const mentionsQ = useMentions(politicianId, { limit: 50 })

  const ppiData = ppiQ.data
  const ppiScore = extractPPIScore(ppiData?.ppi)
  const sov24h = extractSov(ppiData?.sov_24h)
  const avgSentiment = extractPPIComponent(ppiData?.ppi, 'avg_sentiment')
  const totalEngagement = extractPPIComponent(ppiData?.ppi, 'total_engagement')

  const buckets: TimeseriesBucket[] = timeseriesQ.data?.buckets ?? []
  const mentionsSum60d = buckets.reduce(
    (sum, b) => sum + (typeof b.count === 'number' ? b.count : 0),
    0,
  )

  const chartData = buckets.map((b) => ({
    date: b.label ?? b.timestamp,
    menciones: typeof b.count === 'number' ? b.count : 0,
    sentimiento:
      typeof b.avg_sentiment === 'number' ? b.avg_sentiment : 0,
  }))

  const sentPct = sentQ.data?.breakdown?.pct
  const sentTotal = sentQ.data?.breakdown?.total ?? 0
  const donutData = sentPct
    ? [
        {
          name: 'Positivo',
          value: sentPct.positive,
          color: 'var(--polaris-sentiment-positive)',
        },
        {
          name: 'Negativo',
          value: sentPct.negative,
          color: 'var(--polaris-sentiment-negative)',
        },
        {
          name: 'Neutral',
          value: sentPct.neutral,
          color: 'var(--polaris-sentiment-neutral)',
        },
        {
          name: 'Mixto',
          value: sentPct.mixed,
          color: 'var(--polaris-sentiment-mixed)',
        },
        {
          name: 'Sarcastico',
          value: sentPct.sarcastic,
          color: 'var(--polaris-accent)',
        },
      ]
    : []

  const alerts = alertsQ.data ?? []
  const activeAlerts = alerts.filter((a) => !a.is_resolved)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title={`Vista General — ${displayName}`}
        subtitle="KPIs principales + tendencias 60d + senales activas"
        actions={<FreshnessBadge data={freshnessQ.data} />}
      />

      {activeAlerts.length > 0 ? <AlertsBanner alerts={alerts} /> : null}

      {/* 5 KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="PPI Score"
          value={ppiScore !== null ? ppiScore.toFixed(2) : '—'}
          loading={ppiQ.isLoading}
        />
        <KPICard
          label="Share of Voice 24h"
          value={sov24h !== null ? sov24h : '—'}
          format="percent"
          loading={ppiQ.isLoading}
        />
        <KPICard
          label="Sentimiento avg"
          value={avgSentiment !== null ? avgSentiment.toFixed(3) : '—'}
          loading={ppiQ.isLoading}
        />
        <KPICard
          label="Engagement total"
          value={totalEngagement !== null ? totalEngagement : '—'}
          format="number"
          loading={ppiQ.isLoading}
        />
        <KPICard
          label="Menciones 60d"
          value={timeseriesQ.data ? mentionsSum60d : '—'}
          format="number"
          loading={timeseriesQ.isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-2 text-ink">
            Volumen + sentimiento 60d
          </h3>
          {timeseriesQ.isLoading ? (
            <SkeletonChart />
          ) : timeseriesQ.isError ? (
            <ErrorState onRetry={() => timeseriesQ.refetch()} />
          ) : chartData.length === 0 ? (
            <EmptyState
              title="Sin buckets de timeseries"
              description="El endpoint no devolvio data para la ventana 60d."
            />
          ) : (
            <>
              <TimeSeriesChart
                data={chartData}
                series={[
                  {
                    key: 'menciones',
                    label: 'Menciones',
                    color: 'var(--polaris-primary)',
                  },
                  {
                    key: 'sentimiento',
                    label: 'Sentimiento avg',
                    color: 'var(--polaris-accent)',
                  },
                ]}
                height={240}
                ariaLabel="Volumen de menciones y sentimiento promedio en 60 dias"
              />
              <p className="text-xs text-ink-muted mt-2 italic">
                Buckets historicos limitados hasta Wave B fix B-15 (orchestrator window).
                Mayoria de buckets pueden ser zero pre-fix.
              </p>
            </>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-2 text-ink">
            Distribucion sentimiento (30d)
          </h3>
          {sentQ.isLoading ? (
            <SkeletonChart />
          ) : sentQ.isError ? (
            <ErrorState onRetry={() => sentQ.refetch()} />
          ) : sentTotal === 0 || donutData.length === 0 ? (
            <EmptyState
              title="Sin sentimiento procesado"
              description="No hay menciones con label de sentimiento en la ventana."
            />
          ) : (
            <DonutChart
              data={donutData}
              height={240}
              centerLabel="Menciones"
              centerValue={sentTotal.toLocaleString('es-MX')}
              ariaLabel="Distribucion porcentual de sentimiento en 5 categorias"
            />
          )}
        </Card>
      </div>

      {/* Secondary row: top critics + top viral mentions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3 text-ink">
            Top 5 voces criticas (30d)
          </h3>
          {topAuthorsQ.isLoading ? (
            <SkeletonTable rows={5} />
          ) : topAuthorsQ.isError ? (
            <ErrorState onRetry={() => topAuthorsQ.refetch()} />
          ) : (
            (() => {
              const filtered = (topAuthorsQ.data?.authors ?? []).filter(
                (a) =>
                  a.author !== 'MX' &&
                  !(a.platforms ?? []).includes('google_trends'),
              )
              if (filtered.length === 0) {
                return (
                  <EmptyState
                    title="Sin criticos validos"
                    description="Tras filtrar synthetic noise (google_trends + author 'MX'), no quedan candidatos."
                  />
                )
              }
              return (
                <ul className="space-y-2">
                  {filtered.slice(0, 5).map((a, i) => (
                    <li
                      key={`${a.author}-${i}`}
                      className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">
                          {a.author}
                        </div>
                        <div className="text-xs text-ink-muted truncate">
                          {(a.platforms ?? []).join(', ') || '(sin plataforma)'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm text-ink tabular-nums">
                          {a.count} menc.
                        </div>
                        <div className="text-xs text-sentiment-negative tabular-nums">
                          {(a.pct_negative * 100).toFixed(0)}% neg
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            })()
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3 text-ink">
            Top 3 menciones virales
          </h3>
          {mentionsQ.isLoading ? (
            <SkeletonTable rows={3} />
          ) : mentionsQ.isError ? (
            <ErrorState onRetry={() => mentionsQ.refetch()} />
          ) : (
            (() => {
              const items = (mentionsQ.data ?? [])
                .filter((m) => m.platform !== 'google_trends')
                .map((m) => {
                  const sum = Object.values(m.engagement_metrics ?? {}).reduce<number>(
                    (s, v) => s + (typeof v === 'number' ? v : 0),
                    0,
                  )
                  return { mention: m, engagementSum: sum }
                })
                .filter((row) => row.engagementSum > 0)
                .sort((a, b) => b.engagementSum - a.engagementSum)
                .slice(0, 3)

              if (items.length === 0) {
                return (
                  <EmptyState
                    icon={<MessageSquare size={48} strokeWidth={1.5} />}
                    title="Sin menciones con engagement"
                    description="Tras filtrar synthetic noise (google_trends) + engagement=0, no quedan candidatos en la pagina actual."
                  />
                )
              }
              return (
                <ul className="space-y-3">
                  {items.map(({ mention: m, engagementSum }) => (
                    <li
                      key={m.id}
                      className="border-b border-border pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="text-xs text-ink-muted font-mono">
                        {m.platform} · {m.author ?? '(anon)'} · engagement{' '}
                        <span className="tabular-nums">{engagementSum}</span>
                      </div>
                      <div className="text-sm text-ink line-clamp-2 mt-0.5">
                        {(m.content ?? '').slice(0, 200) || '(sin contenido)'}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            })()
          )}
        </Card>
      </div>

      {/* Topics RED — empty state honest */}
      <Card>
        <h3 className="text-sm font-semibold mb-3 text-ink">Topics agregados</h3>
        {topicsQ.isLoading ? (
          <SkeletonTable rows={3} />
        ) : topicsQ.isError ? (
          <ErrorState onRetry={() => topicsQ.refetch()} />
        ) : (topicsQ.data?.topics ?? []).length === 0 ? (
          <EmptyState
            icon={<Hash size={48} strokeWidth={1.5} />}
            title="Sin topics agregados aun"
            description="Endpoint /topics devuelve vacio pese a ~21% de menciones con clasificacion en DB. Pendiente Wave B fix aggregator."
          />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topicsQ.data!.topics.slice(0, 8).map((t) => (
              <li
                key={t.topic}
                className="flex items-center justify-between border border-border rounded-md px-3 py-2"
              >
                <span className="text-sm text-ink truncate">{t.topic}</span>
                <span className="font-mono text-xs text-ink-muted tabular-nums">
                  {t.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Footer disclaimer */}
      <div className="flex items-start gap-2 text-xs text-ink-subtle italic">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Pre-Wave-B: buckets historicos truncados (B-15), momentum EMA=0, topics
          aggregator vacio. KPIs PPI/SoV/Sentimiento/Engagement reflejan datos
          reales del backend (verificados 2026-05-18).
        </span>
      </div>
    </div>
  )
}

export default VistaGeneral
