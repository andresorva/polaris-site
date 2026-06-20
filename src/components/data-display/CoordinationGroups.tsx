/**
 * CoordinationGroups - "Deteccion de coordinacion" panel (mockup 08-voces).
 *
 * Renders detector output from GET /:id/coordination-groups. The backend row is
 * an OPEN shape (id, politician_id, detected_at, is_resolved, ...detector
 * fields). We defensively read the common candidate fields for score, members
 * and indicators WITHOUT inventing values: anything missing renders as an honest
 * fallback, never fabricated. Synthetic member handles (e.g. 'MX') are excluded.
 *
 * Presentational + self-stating: owns the 4 honest states
 * (loading / error / empty / data).
 *
 * REGLA 79: ASCII-only in every visible string.
 */

import { useMemo } from 'react'
import { Network } from 'lucide-react'
import type { CoordinationGroup } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'
import { formatDate } from '../../lib/utils/format'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SkeletonTable } from '../states/LoadingSkeleton'

// ---------------------------------------------------------------------------
// Defensive readers over the open detector row.
// ---------------------------------------------------------------------------

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => {
      if (typeof x === 'string') return x
      if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>
        const cand = o.author ?? o.handle ?? o.username ?? o.id ?? o.name
        return typeof cand === 'string' ? cand : null
      }
      return null
    })
    .filter((s): s is string => !!s)
}

function isSyntheticHandle(h: string): boolean {
  return h === 'MX' || h.trim() === ''
}

function readScore(g: CoordinationGroup): number | null {
  return (
    num(g.score) ??
    num(g.coordination_score) ??
    num(g.confidence) ??
    num((g as Record<string, unknown>).probability)
  )
}

function readMembers(g: CoordinationGroup): string[] {
  const raw =
    asStringList(g.members).length > 0
      ? asStringList(g.members)
      : asStringList(g.accounts).length > 0
        ? asStringList(g.accounts)
        : asStringList(g.authors)
  return raw.filter((h) => !isSyntheticHandle(h))
}

function readMemberCount(g: CoordinationGroup, members: string[]): number {
  return num(g.member_count) ?? num(g.account_count) ?? members.length
}

function readIndicators(g: CoordinationGroup): string[] {
  return asStringList(g.indicators).length > 0
    ? asStringList(g.indicators)
    : asStringList(g.signals).length > 0
      ? asStringList(g.signals)
      : asStringList(g.reasons)
}

function initials(handle: string): string {
  return handle.replace(/[@.]/g, '').slice(0, 2).toUpperCase() || '??'
}

// ---------------------------------------------------------------------------
// One coordination card
// ---------------------------------------------------------------------------

function CoordCard({ group, index }: { group: CoordinationGroup; index: number }) {
  const members = readMembers(group)
  const count = readMemberCount(group, members)
  const score = readScore(group)
  const indicators = readIndicators(group)
  const letter = String.fromCharCode(65 + (index % 26))

  return (
    <div
      className="rounded-md p-4 mb-3 last:mb-0"
      style={{
        border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
        background: 'var(--warning-soft, color-mix(in srgb, var(--warning) 10%, transparent))',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <b className="font-bold text-ink">
          Grupo {letter}
          {count > 0 ? ` - ${count} cuentas` : ''}
        </b>
        {score !== null ? (
          <span
            className="flex items-center gap-1.5 font-mono text-[11px] font-semibold"
            style={{ color: 'var(--warning)' }}
          >
            <Network size={13} aria-hidden="true" />
            score {score.toFixed(2)}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-muted italic">
            score n/d
          </span>
        )}
      </div>

      {members.length > 0 ? (
        <div className="flex my-2.5" aria-label="Cuentas del grupo">
          {members.slice(0, 8).map((m, i) => (
            <span
              key={`${m}-${i}`}
              title={m}
              className={cn(
                'grid place-items-center w-7 h-7 rounded-full bg-surface',
                'text-[10px] font-bold text-ink-muted',
                i > 0 && '-ml-2',
              )}
              style={{ border: '2px solid var(--bg-card)' }}
            >
              {initials(m)}
            </span>
          ))}
          {members.length > 8 ? (
            <span className="ml-2 self-center text-[11px] text-ink-muted">
              +{members.length - 8}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="my-2.5 text-[11px] text-ink-muted italic">
          Miembros: API PENDIENTE (detector no expone handles).
        </p>
      )}

      {indicators.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {indicators.map((ind, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px] text-ink-muted"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--warning)' }}
                aria-hidden="true"
              />
              <span>{ind}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-ink-muted">
          Detectado: {formatDate(group.detected_at)}
          {group.is_resolved ? ' - resuelto' : ''}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CoordinationGroups
// ---------------------------------------------------------------------------

export type CoordinationGroupsProps = {
  groups: CoordinationGroup[] | undefined
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  className?: string
}

export function CoordinationGroups({
  groups,
  loading = false,
  error = false,
  onRetry,
  className,
}: CoordinationGroupsProps) {
  // Sort by score desc when available so the most suspicious group leads.
  const sorted = useMemo(() => {
    const list = groups ?? []
    return [...list].sort((a, b) => (readScore(b) ?? 0) - (readScore(a) ?? 0))
  }, [groups])

  if (loading) return <SkeletonTable rows={3} className={className} />
  if (error)
    return (
      <ErrorState
        className={className}
        title="No se pudo cargar la coordinacion"
        description="Hubo un problema al traer los grupos detectados. Intenta de nuevo."
        onRetry={onRetry}
      />
    )
  if (sorted.length === 0)
    return (
      <EmptyState
        className={className}
        icon={<Network size={48} strokeWidth={1.5} />}
        title="Coordinacion no detectada"
        description="No hay grupos de cuentas coordinadas identificados en la ventana actual."
      />
    )

  return (
    <div className={className}>
      {sorted.map((g, i) => (
        <CoordCard key={g.id ?? i} group={g} index={i} />
      ))}
    </div>
  )
}

export default CoordinationGroups
