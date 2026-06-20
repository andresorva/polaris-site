/**
 * Crisis y alertas — Mockup 09 (design v3).
 *
 * Feed de alertas con z-score. Cada tarjeta (AlertCard, export compartido) es un
 * acordeon expandible con: menciones que dispararon la alerta, sentimiento del
 * cluster, recomendaciones IA y acciones cableadas a useAlertPatch
 * (Responder / Escalar / Marcar atendida).
 *
 * Filtros: severidad (Todas / Critical / Warning / Watch / Info) + estado
 * (Solo activas / Mostrar todas). Header con conteo de activas y campana que
 * tiembla (bell-shake) solo cuando hay una critica abierta. Deep-link a Fuentes
 * por tema via <Link ?topic=> (no hash).
 *
 * Fuentes de datos: useAlerts (feed) + useCrisisSignals (banda superior de
 * senales en vivo cuando el backend reporta crisis activa). El cuerpo de cada
 * alerta (triggers / sentimiento / recomendaciones) hoy es mayormente sintetico
 * en backend -> DemoBadge honesto en esos paneles.
 *
 * 4 estados: loading (LoadingState), error (ErrorState), empty (EmptyState),
 * data. Responsive mobile-first. REGLA 79: ASCII puro en todo string visible;
 * la animacion de la campana respeta prefers-reduced-motion (regla global en
 * index.css neutraliza la duracion).
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Radio } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { AlertCard } from '../../components/data-display/AlertCard'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { LoadingState } from '../../components/states/LoadingState'
import { DemoBadge } from '../../components/states/DemoBadge'
import { useAlerts, useCrisisSignals } from '../../lib/api/queries'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import type { Alert, AlertSeverity, CrisisSignal } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'
import { relativeTime } from '../../lib/utils/format'
import { platformLabel } from '../../lib/utils/platforms'

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

type SeverityFilter = 'all' | AlertSeverity
type StateFilter = 'active' | 'all'

const SEVERITY_FILTERS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'watch', label: 'Watch' },
  { value: 'info', label: 'Info' },
]

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  watch: 2,
  info: 3,
}

// ---------------------------------------------------------------------------
// Extraccion defensiva de tags (la fila Alert es loose: [key]: unknown).
// Se usa para los deep-links a Fuentes por tema.
// ---------------------------------------------------------------------------

function alertTopics(alert: Alert): string[] {
  const raw =
    (alert.tags as unknown) ??
    (alert.topic_categories as unknown) ??
    (alert.topics as unknown)
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const x of raw) {
    if (typeof x !== 'string') continue
    const t = x.trim()
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t)
  }
  return out.slice(0, 6)
}

// ---------------------------------------------------------------------------
// Chip de filtro (estilo v3: pill activable)
// ---------------------------------------------------------------------------

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center h-8 px-3.5 rounded-pill text-[13px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'bg-primary text-white border border-primary'
          : 'bg-card text-ink-muted border border-border-subtle hover:bg-sunken',
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Deep-links a Fuentes por tema (debajo de cada AlertCard). El AlertCard
// compartido pinta los tags como chips estaticos; aqui los exponemos como
// <Link ?topic=> para navegar a las menciones del tema (no hash).
// ---------------------------------------------------------------------------

function TopicLinks({ alert }: { alert: Alert }) {
  const topics = alertTopics(alert)
  if (topics.length === 0) return null
  return (
    <div className="-mt-1 mb-3 flex flex-wrap items-center gap-2 px-1">
      <span className="text-[11px] font-mono uppercase tracking-wide text-ink-subtle">
        Ver en Fuentes
      </span>
      {topics.map((t) => (
        <Link
          key={t}
          to={`/dashboard/fuentes?topic=${encodeURIComponent(t)}`}
          className={cn(
            'inline-flex items-center gap-1 h-7 px-2.5 rounded-pill text-[12px]',
            'bg-sunken text-ink-muted border border-border-subtle',
            'hover:text-ink hover:border-border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          {t}
          <ChevronRight size={12} aria-hidden="true" />
        </Link>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Banda de senales en vivo (useCrisisSignals). Solo aparece si el backend
// reporta crisis activa. Data en vivo del detector -> sin DemoBadge.
// ---------------------------------------------------------------------------

function LiveSignalsStrip({
  signals,
  windowHours,
}: {
  signals: CrisisSignal[]
  windowHours: number
}) {
  const top = signals.slice(0, 4)
  return (
    <Card
      className="border-l-[3px]"
      style={{ borderLeftColor: 'var(--error)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Radio
          size={15}
          aria-hidden="true"
          style={{ color: 'var(--error)' }}
        />
        <span className="text-sm font-semibold text-ink">
          Crisis activa detectada
        </span>
        <span className="font-mono text-[11px] text-ink-subtle">
          {signals.length} senal{signals.length === 1 ? '' : 'es'} en ultimas{' '}
          {windowHours}h
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {top.map((s) => {
          const who = [
            s.author ? `@${s.author}` : null,
            platformLabel(s.platform),
          ]
            .filter(Boolean)
            .join(' · ')
          return (
            <div
              key={s.id}
              className="rounded-xs bg-sunken px-3 py-2.5 text-sm text-ink"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-mono text-ink-subtle truncate">
                  {who || 'senal'}
                </span>
                {s.published_at ? (
                  <span className="text-[11px] font-mono text-ink-subtle whitespace-nowrap">
                    {relativeTime(s.published_at)}
                  </span>
                ) : null}
              </div>
              <p className="line-clamp-2 text-ink-muted">{s.content}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Header con campana (bell-shake solo si hay critica activa).
// La keyframe se inyecta scoped; el media-query global de prefers-reduced-motion
// (index.css) neutraliza la duracion sin tocar archivos compartidos.
// ---------------------------------------------------------------------------

function AlertBell({ shake }: { shake: boolean }) {
  return (
    <>
      <style>{`
        @keyframes polaris-bell-shake {
          0%, 92%, 100% { transform: rotate(0); }
          94% { transform: rotate(12deg); }
          96% { transform: rotate(-10deg); }
          98% { transform: rotate(6deg); }
        }
      `}</style>
      <Bell
        size={16}
        aria-hidden="true"
        style={
          shake
            ? {
                transformOrigin: 'top center',
                animation:
                  'polaris-bell-shake 2.4s var(--ease-in-out) infinite',
              }
            : undefined
        }
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export function Alertas() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  const alertsQ = useAlerts(politicianId)
  const crisisQ = useCrisisSignals(politicianId)

  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [stateFilter, setStateFilter] = useState<StateFilter>('active')

  const alerts = useMemo(() => alertsQ.data ?? [], [alertsQ.data])

  const activeCount = useMemo(
    () => alerts.filter((a) => !a.is_resolved).length,
    [alerts],
  )

  const hasActiveCritical = useMemo(
    () =>
      alerts.some((a) => a.severity === 'critical' && !a.is_resolved) ||
      (crisisQ.data?.has_active_crisis ?? false),
    [alerts, crisisQ.data],
  )

  const filtered = useMemo(() => {
    const bySev =
      severity === 'all'
        ? alerts
        : alerts.filter((a) => a.severity === severity)
    const byState =
      stateFilter === 'active' ? bySev.filter((a) => !a.is_resolved) : bySev
    // Orden: severidad asc (critical primero), luego mas reciente.
    return [...byState].sort((a, b) => {
      const ra = SEVERITY_RANK[a.severity] ?? 9
      const rb = SEVERITY_RANK[b.severity] ?? 9
      if (ra !== rb) return ra - rb
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [alerts, severity, stateFilter])

  const crisisActive =
    crisisQ.data?.has_active_crisis &&
    (crisisQ.data?.signals?.length ?? 0) > 0

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* page-head v3 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-subtle">
            Operacion
          </div>
          <h1 className="mt-1 text-2xl font-bold text-ink">Crisis y alertas</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Senales detectadas con z-score. Reacciona rapido: cada alerta trae
            las menciones que la dispararon y recomendaciones accionables.
          </p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2.5 h-9 px-4 rounded-pill shrink-0 text-sm font-semibold',
          )}
          style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
        >
          <AlertBell shake={hasActiveCritical} />
          <span className="tabular-nums">
            {activeCount} alerta{activeCount === 1 ? '' : 's'} activa
            {activeCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Banda de senales en vivo (crisis activa) */}
      {crisisActive && crisisQ.data ? (
        <LiveSignalsStrip
          signals={crisisQ.data.signals}
          windowHours={crisisQ.data.window_hours}
        />
      ) : null}

      {/* Barra de filtros */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
            Severidad
          </span>
          {SEVERITY_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              active={severity === f.value}
              onClick={() => setSeverity(f.value)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
            Estado
          </span>
          <FilterChip
            active={stateFilter === 'active'}
            onClick={() => setStateFilter('active')}
          >
            Solo activas
          </FilterChip>
          <FilterChip
            active={stateFilter === 'all'}
            onClick={() => setStateFilter('all')}
          >
            Mostrar todas
          </FilterChip>
        </div>

        <div className="sm:ml-auto font-mono text-[11px] tabular-nums text-ink-subtle">
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
        </div>
      </Card>

      {/* Feed */}
      {alertsQ.isLoading ? (
        <LoadingState variant="block" count={4} label="Cargando alertas" />
      ) : alertsQ.isError ? (
        <ErrorState
          title="No pudimos cargar las alertas"
          description="El endpoint /alerts respondio con error. Reintenta."
          onRetry={() => alertsQ.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} strokeWidth={1.5} />}
          title={
            alerts.length === 0
              ? 'Sin alertas registradas'
              : 'Sin resultados para los filtros'
          }
          description={
            alerts.length === 0
              ? 'El backend no tiene alertas activas ni historicas para este politico.'
              : 'Ajusta severidad o estado para ver mas alertas.'
          }
        />
      ) : (
        <div>
          {/* DemoBadge: el cuerpo de cada alerta (triggers/sentimiento/recs)
              es mayormente sintetico en backend hasta que se cableen los
              campos granulares. Disclosure honesto. */}
          <div className="mb-3 flex items-center gap-2">
            <DemoBadge />
            <span className="text-[11px] text-ink-subtle">
              El detalle de cada alerta (menciones, sentimiento del cluster,
              recomendaciones) es ilustrativo hasta cablear los campos del
              backend.
            </span>
          </div>

          <div className="space-y-0">
            {filtered.map((a, i) => (
              <div key={a.id}>
                <AlertCard
                  alert={a}
                  defaultOpen={i === 0}
                  politicianId={politicianId}
                />
                <TopicLinks alert={a} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Alertas
