import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonTable } from '../../components/states/LoadingSkeleton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { useAlerts } from '../../lib/api/queries'
import type { Alert, AlertSeverity } from '../../lib/api/types'
import { formatRelativeTime } from '../../lib/utils/format'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type SeverityFilter = 'all' | AlertSeverity
type ResolvedFilter = 'active' | 'all'

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'watch', label: 'Watch' },
  { value: 'info', label: 'Info' },
]

// ---------------------------------------------------------------------------
// Severity → visual mapping
// ---------------------------------------------------------------------------

function severityClasses(s: AlertSeverity): {
  card: string
  badge: string
  iconColor: string
} {
  switch (s) {
    case 'critical':
      return {
        card: 'border-red-500/40 bg-red-500/5',
        badge:
          'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
        iconColor: 'text-red-600 dark:text-red-400',
      }
    case 'warning':
      return {
        card: 'border-orange-500/40 bg-orange-500/5',
        badge:
          'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300',
        iconColor: 'text-orange-600 dark:text-orange-400',
      }
    case 'watch':
      return {
        card: 'border-yellow-500/40 bg-yellow-500/5',
        badge:
          'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
      }
    case 'info':
    default:
      return {
        card: 'border-blue-500/40 bg-blue-500/5',
        badge:
          'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
        iconColor: 'text-blue-600 dark:text-blue-400',
      }
  }
}

function severityIcon(s: AlertSeverity, className: string) {
  switch (s) {
    case 'critical':
      return <AlertTriangle size={18} className={className} aria-hidden="true" />
    case 'warning':
      return <AlertTriangle size={18} className={className} aria-hidden="true" />
    case 'watch':
      return <Eye size={18} className={className} aria-hidden="true" />
    case 'info':
    default:
      return <Info size={18} className={className} aria-hidden="true" />
  }
}

// ---------------------------------------------------------------------------
// AlertCard
// ---------------------------------------------------------------------------

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false)
  const cls = severityClasses(alert.severity)
  const inferredTopic = (alert.alert_type ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')

  return (
    <Card
      padded={false}
      className={cn('overflow-hidden border', cls.card)}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          {severityIcon(alert.severity, cls.iconColor)}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide border',
                cls.badge,
              )}
            >
              {alert.severity}
            </span>
            {alert.is_resolved ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide border border-border bg-surface-elevated text-ink-muted">
                <CheckCircle size={10} aria-hidden="true" />
                resuelta
              </span>
            ) : null}
            <span className="text-xs text-ink-subtle font-mono">
              {formatRelativeTime(alert.created_at)}
            </span>
            {typeof alert.z_score === 'number' ? (
              <span className="text-xs font-mono text-ink-muted tabular-nums">
                z={alert.z_score.toFixed(2)}
              </span>
            ) : null}
          </div>
          <div className="font-semibold text-ink">{alert.title}</div>
          {alert.description ? (
            <div
              className={cn(
                'text-sm text-ink-muted',
                expanded ? '' : 'line-clamp-2',
              )}
            >
              {alert.description}
            </div>
          ) : null}
          {expanded ? (
            <div className="mt-2 pt-2 border-t border-border/60 space-y-2">
              <div className="text-xs font-mono text-ink-subtle">
                alert_type:{' '}
                <span className="text-ink-muted">{alert.alert_type}</span>
              </div>
              {alert.resolved_at ? (
                <div className="text-xs font-mono text-ink-subtle">
                  resolved_at:{' '}
                  <span className="text-ink-muted">
                    {formatRelativeTime(alert.resolved_at)}
                  </span>
                </div>
              ) : null}
              <Link
                to={`/dashboard/fuentes?topic=${encodeURIComponent(inferredTopic)}`}
                className="inline-flex items-center gap-1 text-xs font-mono underline underline-offset-2 hover:no-underline text-ink"
                onClick={(e) => e.stopPropagation()}
              >
                Ver mentions relacionadas
                <ChevronRight size={12} aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-ink-subtle">
          <ChevronDown
            size={16}
            className={cn(
              'transition-transform',
              expanded ? 'rotate-180' : 'rotate-0',
            )}
            aria-hidden="true"
          />
        </div>
      </button>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Alertas page
// ---------------------------------------------------------------------------

export function Alertas() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  const alertsQ = useAlerts(politicianId)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('active')

  const alerts = useMemo(() => alertsQ.data ?? [], [alertsQ.data])

  const filtered = useMemo(() => {
    const bySeverity =
      severityFilter === 'all'
        ? alerts
        : alerts.filter((a) => a.severity === severityFilter)
    const byResolved =
      resolvedFilter === 'active'
        ? bySeverity.filter((a) => !a.is_resolved)
        : bySeverity
    return [...byResolved].sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return tb - ta
    })
  }, [alerts, severityFilter, resolvedFilter])

  const activeCount = useMemo(
    () => alerts.filter((a) => !a.is_resolved).length,
    [alerts],
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Crisis y alertas"
        subtitle="Senales detectadas — filtrar por severidad, plataforma, topic"
        actions={
          <div className="inline-flex items-center gap-2 text-sm text-ink-muted">
            <Bell size={14} aria-hidden="true" />
            <span className="font-mono tabular-nums">
              {activeCount} alerta{activeCount === 1 ? '' : 's'} activa
              {activeCount === 1 ? '' : 's'}
            </span>
          </div>
        }
      />

      {/* Filters bar */}
      <Card className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="severity-filter"
            className="text-xs font-mono uppercase tracking-wide text-ink-subtle"
          >
            Severidad
          </label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(e.target.value as SeverityFilter)
            }
            className="bg-surface-elevated border border-border rounded-md px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wide text-ink-subtle">
            Estado
          </span>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setResolvedFilter('active')}
              className={cn(
                'px-3 py-1 text-xs font-mono transition-colors',
                resolvedFilter === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.04]',
              )}
              aria-pressed={resolvedFilter === 'active'}
            >
              Solo activas
            </button>
            <button
              type="button"
              onClick={() => setResolvedFilter('all')}
              className={cn(
                'px-3 py-1 text-xs font-mono transition-colors border-l border-border',
                resolvedFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.04]',
              )}
              aria-pressed={resolvedFilter === 'all'}
            >
              Mostrar todas
            </button>
          </div>
        </div>

        <div className="sm:ml-auto text-xs font-mono text-ink-subtle tabular-nums">
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
        </div>
      </Card>

      {/* Feed */}
      {alertsQ.isLoading ? (
        <SkeletonTable rows={4} />
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
        <div className="flex flex-col gap-3">
          {filtered.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Alertas
