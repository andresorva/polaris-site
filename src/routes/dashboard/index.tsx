/**
 * Vista General (mockup 04-vista-general.html) — PANTALLA #1 (demo).
 *
 * Layout v3:
 *   page-head (eyebrow + nombre + sub + FreshnessBadge)
 *   AlertBanner (variant inline, peor alerta activa) — solo si hay alertas
 *   KPI grid x5 (volumen, sentimiento neto, alcance, criticos, freshness) c/sparkline
 *   grid-2: VolumeSentimentChart (60d) | SentimentDonut (30d)
 *   grid-2b: CriticsTable top-5 (30d) | ViralMentions (por engagement)
 *
 * 4 estados por panel (loading / empty / error / data) los resuelven los
 * componentes auto-estado; los KPI derivados resuelven loading/empty inline.
 * Responsive mobile-first. Respeta prefers-reduced-motion (la animacion vive en
 * los componentes importados; aqui no se anaden animaciones nuevas).
 *
 * El politician id activo viene del contexto de cliente (theme store /
 * ClientSelector). NO se hardcodea.
 *
 * REGLA 79: cero acentos ni n-con-tilde en strings visibles.
 */

import { useNavigate } from 'react-router-dom'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import {
  useFreshness,
  usePPI,
  useSentimentBreakdown,
  useTimeseries,
  useTopAuthors,
} from '../../lib/api/queries'
import type { TimeseriesBucket } from '../../lib/api/types'
import { KPICard } from '../../components/data-display/KPICard'
import { FreshnessBadge } from '../../components/data-display/FreshnessBadge'
import { AlertBanner } from '../../components/data-display/AlertBanner'
import { ViralMentions } from '../../components/data-display/ViralMentions'
import { CriticsTable, isSyntheticAuthor } from '../../components/data-display/CriticsTable'
import { VolumeSentimentChart } from '../../components/charts/VolumeSentimentChart'
import { SentimentDonut } from '../../components/charts/SentimentDonut'
import type { SentimentCounts } from '../../components/charts/sentimentColors'
import { Card } from '../../components/ui/Card'

// ---------------------------------------------------------------------------
// Helpers — extraccion segura desde la forma laxa de PPI (Record<unknown>).
// ---------------------------------------------------------------------------

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function ppiComponent(ppi: unknown, key: string): number | null {
  const obj = asRecord(ppi)
  const components = asRecord(obj?.components)
  // El backend puede exponer el valor en components{} o directo en el dict raiz.
  return numOrNull(components?.[key]) ?? numOrNull(obj?.[key])
}

// ---------------------------------------------------------------------------
// Formato compacto para KPIs grandes (alcance / engagement). en-US grouping
// para evitar separadores con acentos (Regla 79).
// ---------------------------------------------------------------------------

function compact(n: number): string {
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  }
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

// ---------------------------------------------------------------------------
// Vista General
// ---------------------------------------------------------------------------

export function VistaGeneral() {
  const navigate = useNavigate()
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  // --- Queries (hooks documentados) ---
  const ppiQ = usePPI(politicianId)
  const sentQ = useSentimentBreakdown(politicianId, { scope: 'all', days: 30 })
  const topAuthorsQ = useTopAuthors(politicianId, {
    limit: 20,
    days: 30,
    scope: 'third_party',
  })
  const freshnessQ = useFreshness(politicianId)
  const timeseriesQ = useTimeseries(politicianId, { days: 60, interval: 'day' })

  // --- Timeseries: volumen + sentimiento por dia (60d) ---
  const buckets: TimeseriesBucket[] = timeseriesQ.data?.buckets ?? []

  const chartData = buckets.map((b) => ({
    label: b.label ?? b.timestamp,
    volume: typeof b.count === 'number' ? b.count : 0,
    sentiment: typeof b.avg_sentiment === 'number' ? b.avg_sentiment : null,
  }))

  const volumeSpark = buckets.map((b) =>
    typeof b.count === 'number' ? b.count : 0,
  )
  const sentimentSpark = buckets
    .map((b) => b.avg_sentiment)
    .filter((v): v is number => typeof v === 'number')

  const mentions60d = buckets.reduce(
    (sum, b) => sum + (typeof b.count === 'number' ? b.count : 0),
    0,
  )

  // Sentimiento neto agregado de la ventana (-1..1): promedio simple de los
  // buckets con dato (honesto: si no hay buckets con sentimiento -> empty).
  const netSentiment =
    sentimentSpark.length > 0
      ? sentimentSpark.reduce((s, v) => s + v, 0) / sentimentSpark.length
      : null

  // --- Sentiment breakdown (30d) para el donut + total ---
  const breakdown = sentQ.data?.breakdown
  const donutCounts: SentimentCounts | null = breakdown
    ? {
        positive: breakdown.positive,
        negative: breakdown.negative,
        neutral: breakdown.neutral,
        mixed: breakdown.mixed,
        sarcastic: breakdown.sarcastic,
      }
    : null
  const donutTotal = breakdown?.total ?? 0

  // --- PPI: alcance / engagement total de la ventana ---
  const totalEngagement = ppiComponent(ppiQ.data?.ppi, 'total_engagement')
  const totalReach =
    ppiComponent(ppiQ.data?.ppi, 'total_reach') ?? totalEngagement

  // --- Criticos: cuenta de voces reales (excluye ruido sintetico) ---
  const realAuthors = (topAuthorsQ.data?.authors ?? []).filter(
    (a) => !isSyntheticAuthor(a),
  )
  const criticsCount = realAuthors.length
  const topCriticPct =
    realAuthors.length > 0
      ? Math.round(
          (realAuthors[0]!.pct_negative <= 1
            ? realAuthors[0]!.pct_negative * 100
            : realAuthors[0]!.pct_negative),
        )
      : null

  // --- Freshness: horas desde colecta para el KPI numerico ---
  const freshHours = freshnessQ.data?.hours_since_collection
  const freshValue =
    freshHours === null || freshHours === undefined
      ? '--'
      : freshHours < 1
        ? '<1'
        : String(Math.round(freshHours))

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* ===================== PAGE HEAD ===================== */}
      <header className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Vista general
          </p>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-ink">
            {client.display_name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            KPIs principales, tendencias a 60 dias y senales activas
            <span aria-hidden="true"> &middot; </span>
            <span className="font-semibold text-ink-muted">{client.party}</span>
          </p>
        </div>
        <FreshnessBadge politicianId={politicianId} />
      </header>

      {/* ===================== ALERTAS (banner inline) ===================== */}
      <AlertBanner
        politicianId={politicianId}
        variant="inline"
        hideWhenEmpty
        onView={() => navigate('/dashboard/alertas')}
      />

      {/* ===================== KPI GRID x5 ===================== */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          label="Volumen 60d"
          value={timeseriesQ.data ? mentions60d : ''}
          format="number"
          sparkline={volumeSpark}
          loading={timeseriesQ.isLoading}
          error={timeseriesQ.isError}
          onRetry={() => timeseriesQ.refetch()}
          note="menciones / 60 dias"
        />

        <KPICard
          label="Sentimiento neto"
          value={
            netSentiment === null
              ? ''
              : `${netSentiment >= 0 ? '+' : ''}${netSentiment.toFixed(2)}`
          }
          sparkline={sentimentSpark}
          loading={timeseriesQ.isLoading}
          error={timeseriesQ.isError}
          onRetry={() => timeseriesQ.refetch()}
          note="promedio -1 a 1"
        />

        <KPICard
          label="Alcance"
          value={totalReach === null ? '' : compact(totalReach)}
          sparkline={volumeSpark}
          loading={ppiQ.isLoading}
          error={ppiQ.isError}
          onRetry={() => ppiQ.refetch()}
          note="engagement acumulado"
        />

        <KPICard
          label="Voces criticas"
          value={topAuthorsQ.data ? criticsCount : ''}
          format="number"
          loading={topAuthorsQ.isLoading}
          error={topAuthorsQ.isError}
          onRetry={() => topAuthorsQ.refetch()}
          note={
            topCriticPct !== null
              ? `top voz ${topCriticPct}% negativo`
              : 'autores con menciones negativas'
          }
        />

        <KPICard
          label="Frescura"
          value={freshnessQ.data ? freshValue : ''}
          unit={
            freshValue === '--' || freshValue === '<1' ? undefined : 'h'
          }
          loading={freshnessQ.isLoading}
          error={freshnessQ.isError}
          onRetry={() => freshnessQ.refetch()}
          note={
            freshnessQ.data ? `estado: ${freshnessQ.data.status}` : 'desde colecta'
          }
        />
      </div>

      {/* ===================== CHARTS ROW ===================== */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight text-ink">
              Volumen y sentimiento
              <span className="ml-1.5 font-normal text-ink-subtle">60 dias</span>
            </h3>
            <span className="font-mono text-[11px] text-ink-subtle">
              menciones / dia
            </span>
          </div>
          <VolumeSentimentChart
            data={chartData}
            isLoading={timeseriesQ.isLoading}
            isError={timeseriesQ.isError}
            onRetry={() => timeseriesQ.refetch()}
            height={300}
            volumeLabel="Volumen"
            sentimentLabel="Sentimiento neto"
            ariaLabel="Volumen de menciones y sentimiento neto en 60 dias"
          />
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight text-ink">
              Distribucion de sentimiento
            </h3>
            <span className="font-mono text-[11px] text-ink-subtle">30d</span>
          </div>
          <SentimentDonut
            counts={donutCounts}
            loading={sentQ.isLoading}
            error={sentQ.isError}
            onRetry={() => sentQ.refetch()}
            size={150}
            centerValue={donutTotal.toLocaleString('en-US')}
            centerLabel="menciones"
            ariaLabel="Distribucion de sentimiento en la ventana de 30 dias"
          />
        </div>
      </div>

      {/* ===================== LISTS ROW ===================== */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card className="flex flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight text-ink">
              Top 5 voces criticas
            </h3>
            <span className="font-mono text-[11px] text-ink-subtle">
              30d &middot; % negativo
            </span>
          </div>
          <CriticsTable
            authors={topAuthorsQ.data?.authors}
            loading={topAuthorsQ.isLoading}
            error={topAuthorsQ.isError}
            onRetry={() => topAuthorsQ.refetch()}
            limit={5}
          />
        </Card>

        <ViralMentions politicianId={politicianId} limit={3} />
      </div>
    </div>
  )
}

export default VistaGeneral
