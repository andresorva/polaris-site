import { useState } from 'react'
import { Inbox, Search } from 'lucide-react'
import { ClientSelector } from '../../features/client-theme/ClientSelector'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { KPICard } from '../../components/data-display/KPICard'
import { TimeSeriesChart } from '../../components/data-display/TimeSeriesChart'
import { DonutChart } from '../../components/data-display/DonutChart'
import { DistributionChart } from '../../components/data-display/DistributionChart'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import {
  SkeletonChart,
  SkeletonKPI,
  SkeletonTable,
} from '../../components/states/LoadingSkeleton'
import { DemoBadge } from '../../components/states/DemoBadge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

// ---------- mock data ----------

function generateTimeSeries(days: number) {
  const today = new Date('2026-05-18T00:00:00Z')
  const rows: { date: string; mentions: number; engagement: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const iso = d.toISOString().slice(5, 10) // MM-DD
    const base = 800 + Math.sin(i / 3) * 200 + (days - i) * 8
    const noise = (i * 37) % 120
    rows.push({
      date: iso,
      mentions: Math.round(base + noise),
      engagement: Math.round((base + noise) * 0.6 + (i % 5) * 20),
    })
  }
  return rows
}

const sparklineSeries = [12, 15, 14, 18, 22, 20, 24, 28, 27, 30, 33, 38]
const flatSparkline = [20, 20, 20, 20, 20]

const sovData = [
  { name: 'Twitter/X', value: 4820 },
  { name: 'Facebook', value: 2140 },
  { name: 'Instagram', value: 1305 },
  { name: 'Bluesky', value: 420 },
  { name: 'TikTok', value: 880 },
]

const sentimentDist = [
  {
    label: 'Positivo',
    value: 1820,
    sentiment: 'positive' as const,
  },
  {
    label: 'Neutral',
    value: 3450,
    sentiment: 'neutral' as const,
  },
  {
    label: 'Negativo',
    value: 980,
    sentiment: 'negative' as const,
  },
  {
    label: 'Mixto',
    value: 540,
    sentiment: 'mixed' as const,
  },
]

// ---------- section wrapper ----------

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="text-sm text-ink-muted mt-1">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}

// ---------- showcase page ----------

export function DevComponentsPage() {
  const { client, mode, resolvedTheme, setMode } = useClientTheme()
  const [retryCount, setRetryCount] = useState(0)

  const timeSeries30 = generateTimeSeries(30)

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm tracking-tight">
              POLARIS · /dev/components
            </div>
            <DemoBadge />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-ink-muted mr-1">Tema:</span>
              {(['light', 'dark', 'system'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={
                    'rounded-md px-2 py-1 text-xs font-mono border ' +
                    (mode === m
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-elevated text-ink border-border hover:bg-[var(--polaris-border)]')
                  }
                >
                  {m}
                </button>
              ))}
            </div>
            <ClientSelector />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-2 text-[11px] font-mono text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
          <span>client: {client.id}</span>
          <span>party: {client.party}</span>
          <span>theme: {resolvedTheme} (mode {mode})</span>
          <span>primary: {client.primary}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        <p className="text-sm text-ink-muted">
          Showcase de la libreria de componentes. Todo render con data mock —
          ningun fetch a API. Toggle el cliente y el tema para validar
          theming.
        </p>

        <Section
          id="ui-atoms"
          title="UI atoms"
          description="Button, Card, Badge."
        >
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </Card>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>default</Badge>
              <Badge variant="positive">positive</Badge>
              <Badge variant="neutral">neutral</Badge>
              <Badge variant="negative">negative</Badge>
              <Badge variant="mixed">mixed</Badge>
              <Badge variant="accent">accent</Badge>
            </div>
          </Card>
        </Section>

        <Section
          id="kpi"
          title="KPICard"
          description="Numero + label + delta + sparkline + loading."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Menciones 24h"
              value={4280}
              delta={{ value: 12.4, period: 'vs ayer' }}
              sparkline={sparklineSeries}
            />
            <KPICard
              label="Engagement 24h"
              value={32145}
              delta={{ value: -4.2, period: 'vs ayer' }}
              sparkline={[40, 38, 36, 35, 30, 28, 24, 22]}
            />
            <KPICard
              label="Sentimiento positivo"
              value={62.4}
              format="percent"
              delta={{ value: 0, period: 'vs ayer' }}
              sparkline={flatSparkline}
            />
            <KPICard label="Cargando" value={0} loading />
          </div>
        </Section>

        <Section
          id="timeseries"
          title="TimeSeriesChart"
          description="Line chart institutional con tooltip monospace."
        >
          <TimeSeriesChart
            data={timeSeries30}
            series={[
              { key: 'mentions', label: 'Menciones' },
              { key: 'engagement', label: 'Engagement' },
            ]}
            height={320}
          />
        </Section>

        <Section
          id="donut"
          title="DonutChart"
          description="Share of voice por plataforma."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DonutChart
              data={sovData}
              centerLabel="Menciones"
              ariaLabel="Share of voice por plataforma"
            />
            <DonutChart
              data={[
                {
                  name: 'Positivo',
                  value: 1820,
                  color: 'var(--polaris-sentiment-positive)',
                },
                {
                  name: 'Neutral',
                  value: 3450,
                  color: 'var(--polaris-sentiment-neutral)',
                },
                {
                  name: 'Negativo',
                  value: 980,
                  color: 'var(--polaris-sentiment-negative)',
                },
                {
                  name: 'Mixto',
                  value: 540,
                  color: 'var(--polaris-sentiment-mixed)',
                },
              ]}
              centerLabel="Sentimiento"
            />
          </div>
        </Section>

        <Section
          id="distribution"
          title="DistributionChart"
          description="Horizontal bars con sentiment color."
        >
          <DistributionChart data={sentimentDist} />
        </Section>

        <Section
          id="states"
          title="Estados"
          description="Empty, Error, Loading, DemoBadge."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padded={false}>
              <EmptyState
                title="Sin menciones todavia"
                description="Cuando lleguen menciones del cliente seleccionado, apareceran aqui."
                icon={<Inbox size={48} strokeWidth={1.5} />}
              />
            </Card>
            <Card padded={false}>
              <EmptyState
                title="Sin resultados"
                description="Intenta con otra consulta o ajusta los filtros."
                icon={<Search size={48} strokeWidth={1.5} />}
                cta={{
                  label: 'Limpiar filtros',
                  onClick: () => {
                    /* noop demo */
                  },
                }}
              />
            </Card>
            <Card padded={false}>
              <ErrorState
                onRetry={() => setRetryCount((c) => c + 1)}
                description={`No pudimos cargar los datos. Reintentos: ${retryCount}`}
              />
            </Card>
            <Card padded={false}>
              <div className="p-6 flex items-center gap-3">
                <DemoBadge />
                <span className="text-sm text-ink-muted">
                  Marca prominente para data mock / placeholder.
                </span>
              </div>
            </Card>
          </div>
        </Section>

        <Section
          id="loading"
          title="LoadingSkeleton variants"
          description="SkeletonKPI, SkeletonChart, SkeletonTable."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
          </div>
          <SkeletonChart />
          <SkeletonTable rows={4} />
        </Section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-border mt-12 text-xs font-mono text-ink-muted">
        Track 1 · Fase 1 · Design system showcase
      </footer>
    </div>
  )
}

export default DevComponentsPage
