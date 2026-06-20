import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '../../lib/utils/cn'
import { Button } from '../ui/Button'
import { PlatformChip } from './PlatformChip'
import { useMentionDetail } from '../../lib/api/queries'
import type { MentionDetail, MentionAgents } from '../../lib/api/extended-types'
import type { SentimentLabel } from '../../lib/api/types'

/**
 * MentionDetailModal — full detail of a single mention with the 9-agent
 * classification block (GET /mentions/{id} via useMentionDetail).
 *
 * Mockup 11-fuentes: a quote header card + a grid of agent chips. Each agent
 * card shows the agent name (eyebrow) and its verdict. Honest 4 states:
 * loading (spinner), error (retry), empty (id given but no body), data.
 *
 * REGLA 79: every visible string is ASCII (a e i o u n) — no accents, no n-tilde.
 * Sentiment colors resolve via CSS vars --sent-* baked into the Tailwind
 * `sentiment-*` token family.
 */

type Props = {
  /** Mention id to show. `null`/`undefined` keeps the modal closed. */
  mentionId: string | null | undefined
  /** Called when the user dismisses (overlay click / Escape / X button). */
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Small ASCII helpers (local — never edits shared utils)
// ---------------------------------------------------------------------------

const SENTIMENT_ES: Record<SentimentLabel, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
  mixed: 'Mixto',
  sarcastic: 'Sarcastico',
}

function sentimentText(label: SentimentLabel | null | undefined): string {
  if (!label) return 'Sin clasificar'
  return SENTIMENT_ES[label] ?? 'Sin clasificar'
}

function sentimentTone(
  label: SentimentLabel | null | undefined,
): 'positive' | 'negative' | 'neutral' | 'mixed' | 'sarcastic' | 'unknown' {
  if (!label) return 'unknown'
  return label
}

function fmtScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return '-'
  const v = Number(score)
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

/** Date as plain ASCII `YYYY-MM-DD HH:MM` (no locale month names => no accents). */
function fmtTimestamp(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function initials(name: string | null | undefined): string {
  if (!name) return '??'
  const cleaned = name.replace(/[@._-]/g, ' ').trim()
  if (!cleaned) return '??'
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function humanizeTopic(t: string): string {
  return t.replace(/_/g, ' ')
}

function asYesNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return 'Sin dato'
  return v ? 'Si' : 'No'
}

// ---------------------------------------------------------------------------
// Agent grid model — derived from the frozen `agents` block
// ---------------------------------------------------------------------------

type AgentCell = {
  name: string
  value: string
  sub?: string
  /** When true the status dot turns warning/danger instead of healthy green. */
  alert?: boolean
}

/**
 * Builds the 9 agent cells from the detail payload. Each cell degrades
 * gracefully when its source field is null (granular fields stay null until
 * backend migs 015-016 land).
 */
function buildAgents(detail: MentionDetail): AgentCell[] {
  const a: MentionAgents = detail.agents
  const topics = a.topic_categories?.length
    ? a.topic_categories
    : detail.topic_categories ?? []
  const primaryTopic = topics[0] ? humanizeTopic(topics[0]) : 'Sin tema'
  const extraTopics = topics.length > 1 ? `+${topics.length - 1} mas` : undefined

  const entityCount = a.entities ? Object.keys(a.entities).length : 0

  return [
    {
      name: 'Sentiment MX',
      value: `${fmtScore(a.sentiment_score)} ${sentimentText(a.sentiment_label)}`,
      sub:
        a.confidence !== null && a.confidence !== undefined
          ? `conf ${a.confidence.toFixed(2)}`
          : undefined,
      alert: a.sentiment_label === 'negative',
    },
    {
      name: 'Topic Classifier',
      value: primaryTopic,
      sub: extraTopics,
    },
    {
      name: 'Entity Extractor',
      value: entityCount > 0 ? `${entityCount} entidades` : 'Sin entidades',
    },
    {
      name: 'Crisis Detector',
      value: a.is_crisis ? 'Crisis activa' : 'Normal',
      alert: !!a.is_crisis,
    },
    {
      name: 'Structurer',
      value: a.content_type ? humanizeTopic(a.content_type) : 'Sin tipo',
    },
    {
      name: 'Sarcasm',
      value: asYesNo(a.is_sarcastic),
      sub: a.is_sarcastic ? 'ironia' : undefined,
      alert: !!a.is_sarcastic,
    },
    {
      name: 'Attack Detector',
      value: asYesNo(a.is_attack),
      alert: !!a.is_attack,
    },
    {
      name: 'Intensity',
      value:
        a.emotional_intensity !== null && a.emotional_intensity !== undefined
          ? a.emotional_intensity.toFixed(2)
          : 'Sin dato',
    },
    {
      name: 'Review Status',
      value: a.pending_review ? 'Pendiente' : 'Aprobada',
      sub: a.processed_at ? fmtTimestamp(a.processed_at) : undefined,
      alert: !!a.pending_review,
    },
  ]
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

// CSS selector for elements that can receive keyboard focus inside the dialog.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function MentionDetailModal({ mentionId, onClose }: Props) {
  const open = !!mentionId
  const query = useMentionDetail(mentionId)
  const closeRef = useRef<HTMLButtonElement>(null)
  // The dialog panel — root for the focus-trap query.
  const panelRef = useRef<HTMLDivElement>(null)
  // The element that had focus before the modal opened (the trigger), so we
  // can hand focus back to it when the modal closes.
  const triggerRef = useRef<HTMLElement | null>(null)

  // Escape to close + Tab focus-trap + lock body scroll while open.
  useEffect(() => {
    if (!open) return
    // Remember the trigger so focus returns to it on close.
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      // Focus-trap: keep Tab / Shift+Tab cycling inside the dialog.
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (focusables.length === 0) {
        // Nothing tabbable yet (e.g. loading state) — pin focus to the panel.
        e.preventDefault()
        panel.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the close button so keyboard users land inside the dialog.
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Return focus to whatever opened the modal.
      triggerRef.current?.focus()
      triggerRef.current = null
    }
  }, [open, onClose])

  const detail = query.data
  const agents = useMemo(
    () => (detail ? buildAgents(detail) : []),
    [detail],
  )

  if (!open) return null

  const tone = sentimentTone(detail?.sentiment_label)

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de mencion"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-[720px] max-h-[86vh] overflow-auto rounded-lg bg-card border border-border-strong shadow-soft outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 bg-card border-b border-border-subtle">
          <span
            className="grid place-items-center h-9 w-9 rounded-full bg-sunken text-ink-muted text-xs font-bold shrink-0"
            aria-hidden="true"
          >
            {initials(detail?.author ?? detail?.author_handle)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink truncate">
              {detail?.author ?? detail?.author_handle ?? 'Cargando...'}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-ink-subtle">
              {detail ? <PlatformChip platform={detail.platform} /> : null}
              {detail ? <span>{fmtTimestamp(detail.collected_at)}</span> : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid place-items-center h-8 w-8 rounded-md text-ink-muted hover:bg-[var(--bg-hover)] hover:text-ink transition-colors shrink-0"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body — 4 honest states */}
        <div className="p-5 sm:p-6">
          {query.isLoading ? (
            <div
              role="status"
              aria-label="Cargando detalle"
              className="flex flex-col items-center justify-center gap-3 py-12 text-ink-muted"
            >
              <Loader2 size={28} className="animate-spin" aria-hidden="true" />
              <span className="text-sm">Cargando los 9 agentes...</span>
            </div>
          ) : query.isError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 py-10 text-center"
            >
              <AlertTriangle
                size={36}
                className="text-sentiment-negative"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div>
                <h3 className="text-base font-semibold text-ink">
                  No pudimos cargar el detalle
                </h3>
                <p className="mt-1 text-sm text-ink-muted max-w-sm">
                  No se pudieron cargar los datos. Reintenta.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => query.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : !detail ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <h3 className="text-base font-semibold text-ink">Sin detalle</h3>
              <p className="text-sm text-ink-muted max-w-sm">
                No hay datos para esta mencion.
              </p>
            </div>
          ) : (
            <>
              {/* Quote */}
              <blockquote
                className="rounded-md bg-sunken border-l-[3px] p-4 mb-5 text-[15px] leading-relaxed text-ink"
                style={{ borderLeftColor: `var(--sent-${tone}, var(--border-strong))` }}
              >
                {detail.title ? (
                  <div className="font-semibold mb-1">{detail.title}</div>
                ) : null}
                {detail.content || 'Sin contenido de texto.'}
              </blockquote>

              {/* Source link */}
              {detail.url ? (
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink mb-5"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  Abrir fuente original
                </a>
              ) : null}

              {/* Agents grid */}
              <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle mb-3">
                Clasificacion · 9 agentes de IA
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {agents.map((cell) => (
                  <div
                    key={cell.name}
                    className="rounded-md bg-sunken border border-border-subtle p-3"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle mb-1.5">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          cell.alert
                            ? 'bg-sentiment-negative'
                            : 'bg-sentiment-positive',
                        )}
                        aria-hidden="true"
                      />
                      {cell.name}
                    </div>
                    <div className="text-sm font-semibold text-ink leading-tight">
                      {cell.value}
                      {cell.sub ? (
                        <span className="block mt-0.5 text-[11px] font-normal text-ink-subtle">
                          {cell.sub}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

export default MentionDetailModal
