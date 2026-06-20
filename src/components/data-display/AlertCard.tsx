/**
 * AlertCard — tarjeta de alerta de crisis, acordeon expandible.
 *
 * Mockup 09 (crisis y alertas): borde-izquierdo coloreado por severidad,
 * cabecera clickeable (badge severidad + titulo + meta + chevron), resumen,
 * tags y, al expandir, tres secciones:
 *   - Menciones que dispararon la alerta
 *   - Sentimiento del cluster (barra pos/neg/neu)
 *   - Recomendaciones IA + acciones (Responder / Escalar / Marcar atendida)
 *
 * Las acciones estan cableadas a `useAlertPatch()` (PATCH /alerts/{id}):
 *   - Responder           -> { estado: 'escalada', note }  (abre flujo + marca)
 *   - Escalar             -> { estado: 'escalada' }
 *   - Marcar como atendida -> { estado: 'atendida', is_resolved: true }
 *
 * Las secciones del cuerpo se renderizan SOLO si el backend trae esos campos
 * (la fila Alert es loose, [key: string]: unknown). Cero data fake hardcodeada.
 *
 * REGLA 79: ASCII puro en todo string visible.
 */

import { useId, useState } from 'react'
import { Check, ChevronDown, Reply, TriangleAlert } from 'lucide-react'
import type { Alert, AlertSeverity } from '../../lib/api/types'
import type { AlertEstado, AlertPatchBody } from '../../lib/api/extended-types'
import { useAlertPatch } from '../../lib/api/queries'
import { cn } from '../../lib/utils/cn'
import { formatRelativeTime } from '../../lib/utils/format'
import { Button } from '../ui/Button'

// ---------------------------------------------------------------------------
// Severidad -> estilos (color de borde + chip). Tokens semanticos v3.
// ---------------------------------------------------------------------------

type SevStyle = {
  label: string
  /** Color de borde-izquierdo + texto del chip. */
  color: string
  /** Fondo suave del chip. */
  soft: string
}

const SEV_STYLE: Record<AlertSeverity, SevStyle> = {
  critical: { label: 'Critical', color: 'var(--error)', soft: 'var(--error-soft)' },
  warning: { label: 'Warning', color: 'var(--warning)', soft: 'var(--warning-soft)' },
  watch: {
    label: 'Watch',
    color: 'var(--watch)',
    soft: 'color-mix(in srgb, var(--watch) 16%, transparent)',
  },
  info: { label: 'Info', color: 'var(--info)', soft: 'var(--info-soft)' },
}

const FALLBACK_SEV: SevStyle = {
  label: 'Alerta',
  color: 'var(--border-strong)',
  soft: 'var(--bg-sunken)',
}

function sevStyle(s: AlertSeverity | string): SevStyle {
  return SEV_STYLE[s as AlertSeverity] ?? FALLBACK_SEV
}

/** Boton de accion en curso (para feedback de loading individual). */
type AlertAction = 'responder' | 'escalar' | 'atendida'

// ---------------------------------------------------------------------------
// Extraccion defensiva de campos opcionales del row Alert (shape loose).
// ---------------------------------------------------------------------------

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
}

interface TriggerMention {
  who: string
  text: string
}

function extractTriggers(alert: Alert): TriggerMention[] {
  const raw =
    (alert.triggering_mentions as unknown) ??
    (alert.trigger_mentions as unknown) ??
    (alert.mentions as unknown)
  if (!Array.isArray(raw)) return []
  const out: TriggerMention[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const m = item as Record<string, unknown>
    const author =
      (typeof m.author_handle === 'string' && m.author_handle) ||
      (typeof m.author === 'string' && m.author) ||
      ''
    const platform = typeof m.platform === 'string' ? m.platform : ''
    const text =
      (typeof m.content === 'string' && m.content) ||
      (typeof m.text === 'string' && m.text) ||
      ''
    if (!text) continue
    const who = [author, platform].filter(Boolean).join(' · ')
    out.push({ who: who || 'mencion', text })
  }
  return out
}

interface ClusterSentiment {
  pos: number
  neg: number
  neu: number
}

function extractSentiment(alert: Alert): ClusterSentiment | null {
  const raw =
    (alert.cluster_sentiment as unknown) ?? (alert.sentiment as unknown)
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0
  const pos = num(s.positive ?? s.pos)
  const neg = num(s.negative ?? s.neg)
  const neu = num(s.neutral ?? s.neu)
  if (pos + neg + neu <= 0) return null
  return { pos, neg, neu }
}

function extractRecommendations(alert: Alert): string[] {
  const raw =
    (alert.recommendations as unknown) ??
    (alert.ai_recommendations as unknown) ??
    (alert.recommended_actions as unknown)
  return asStringArray(raw)
}

function extractTags(alert: Alert): string[] {
  const raw =
    (alert.tags as unknown) ??
    (alert.topic_categories as unknown) ??
    (alert.topics as unknown)
  return asStringArray(raw)
}

function metaLine(alert: Alert): string {
  const when = formatRelativeTime(alert.created_at)
  const z =
    typeof alert.z_score === 'number' && Number.isFinite(alert.z_score)
      ? `z=${alert.z_score.toFixed(2)}`
      : null
  return [when, z].filter(Boolean).join(' · ')
}

// ---------------------------------------------------------------------------
// Subcomponentes del cuerpo
// ---------------------------------------------------------------------------

function BodySection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-border-subtle pt-3.5 mt-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-subtle mb-2.5">
        {label}
      </div>
      {children}
    </div>
  )
}

function SentimentBar({ s }: { s: ClusterSentiment }) {
  const total = s.pos + s.neg + s.neu || 1
  const pct = (n: number) => Math.round((n / total) * 100)
  const pPos = pct(s.pos)
  const pNeg = pct(s.neg)
  const pNeu = pct(s.neu)
  return (
    <div>
      <div className="flex h-[7px] rounded-pill overflow-hidden bg-sunken mb-1.5">
        <span style={{ width: `${pPos}%`, background: 'var(--sent-positive)' }} />
        <span style={{ width: `${pNeg}%`, background: 'var(--sent-negative)' }} />
        <span style={{ width: `${pNeu}%`, background: 'var(--sent-neutral)' }} />
      </div>
      <div className="flex flex-wrap gap-3 font-mono text-[11px] text-ink-subtle">
        <span style={{ color: 'var(--sent-positive)' }}>{pPos}% pos</span>
        <span style={{ color: 'var(--sent-negative)' }}>{pNeg}% neg</span>
        <span style={{ color: 'var(--sent-neutral)' }}>{pNeu}% neu</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AlertCard
// ---------------------------------------------------------------------------

type Props = {
  alert: Alert
  /** Si arranca expandida (la primera del feed suele abrirse). */
  defaultOpen?: boolean
  /** Scope para invalidar el cache de alertas tras un PATCH. */
  politicianId?: string
  className?: string
}

export function AlertCard({
  alert,
  defaultOpen = false,
  politicianId,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  const patch = useAlertPatch()

  const sev = sevStyle(alert.severity)
  const triggers = extractTriggers(alert)
  const sentiment = extractSentiment(alert)
  const recs = extractRecommendations(alert)
  const tags = extractTags(alert)
  const summary = alert.description || ''
  const resolved = alert.is_resolved

  // Cual de los 3 botones esta en curso (distingue Responder de Escalar, que
  // comparten estado 'escalada'). Se limpia en onSettled.
  const [pendingAction, setPendingAction] = useState<AlertAction | null>(null)

  function runPatch(
    action: AlertAction,
    estado: AlertEstado,
    extra?: AlertPatchBody,
  ) {
    if (patch.isPending) return
    setPendingAction(action)
    patch.mutate(
      {
        id: alert.id,
        body: { estado, ...extra },
        politicianId,
      },
      {
        onSettled: () => setPendingAction(null),
      },
    )
  }

  const busy = patch.isPending

  return (
    <div
      className={cn(
        'bg-card border border-border-subtle rounded-md shadow-soft overflow-hidden mb-3',
        'border-l-[3px] transition-shadow hover:shadow-medium',
        resolved && 'opacity-60',
        className,
      )}
      style={{ borderLeftColor: sev.color }}
      data-severity={alert.severity}
    >
      {/* Cabecera clickeable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-4 text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        )}
      >
        <span
          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-pill text-[10px] font-bold uppercase tracking-[0.04em] shrink-0"
          style={{ background: sev.soft, color: sev.color }}
        >
          {alert.severity === 'critical' ? (
            <TriangleAlert size={11} aria-hidden="true" />
          ) : null}
          {sev.label}
        </span>
        <span className="flex-1 min-w-0 text-base font-semibold text-ink truncate">
          {alert.title}
        </span>
        <span className="font-mono text-[11px] text-ink-subtle whitespace-nowrap shrink-0">
          {metaLine(alert)}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn(
            'text-ink-subtle shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Resumen + tags (siempre visibles bajo la cabecera) */}
      {summary ? (
        <p className="px-4 pb-3 -mt-1.5 text-sm text-ink-muted">{summary}</p>
      ) : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center h-6 px-2.5 rounded-pill text-[11px] bg-sunken text-ink-muted border border-border-subtle"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {/* Cuerpo expandible */}
      <div
        id={bodyId}
        role="region"
        hidden={!open}
        className={cn('px-4 pb-4', !open && 'hidden')}
      >
        {triggers.length > 0 ? (
          <BodySection label="Menciones que dispararon la alerta">
            <div className="space-y-2">
              {triggers.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xs bg-sunken px-3 py-2.5 text-sm text-ink"
                >
                  <div className="text-[11px] text-ink-subtle mb-1 font-mono">
                    {m.who}
                  </div>
                  {m.text}
                </div>
              ))}
            </div>
          </BodySection>
        ) : null}

        {sentiment ? (
          <BodySection label="Sentimiento del cluster">
            <SentimentBar s={sentiment} />
          </BodySection>
        ) : null}

        {recs.length > 0 ? (
          <BodySection label="Recomendaciones IA">
            <div className="space-y-2.5">
              {recs.map((r, i) => (
                <div key={i} className="flex gap-2.5">
                  <span
                    className="grid place-items-center h-[22px] w-[22px] shrink-0 rounded-[6px] mt-px"
                    style={{
                      background: 'var(--primary-soft)',
                      color: 'var(--polaris-primary)',
                    }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.4} />
                  </span>
                  <span className="text-sm text-ink-muted">{r}</span>
                </div>
              ))}
            </div>
          </BodySection>
        ) : null}

        {/* Acciones cableadas a useAlertPatch */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            size="sm"
            variant="primary"
            disabled={busy || resolved}
            loading={pendingAction === 'responder'}
            onClick={() =>
              runPatch('responder', 'escalada', {
                note: 'Respuesta en curso desde Crisis.',
              })
            }
          >
            <Reply size={14} aria-hidden="true" />
            Responder
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || resolved}
            loading={pendingAction === 'escalar'}
            onClick={() => runPatch('escalar', 'escalada')}
          >
            Escalar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || resolved}
            loading={pendingAction === 'atendida'}
            onClick={() => runPatch('atendida', 'atendida', { is_resolved: true })}
          >
            Marcar como atendida
          </Button>
        </div>

        {patch.isError ? (
          <p
            role="alert"
            className="mt-2 text-xs text-sentiment-negative"
          >
            No se pudo actualizar la alerta. Intenta de nuevo.
          </p>
        ) : null}
      </div>
    </div>
  )
}
