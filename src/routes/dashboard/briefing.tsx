import { useMemo, useState } from 'react'
import { FileDown, Sparkles, AlertOctagon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonChart } from '../../components/states/LoadingSkeleton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { useDailyBrief } from '../../lib/api/queries'
import { cn } from '../../lib/utils/cn'

// ---------------------------------------------------------------------------
// REGLA 79: strip accents from UI strings WE control (chrome/labels). Backend
// strings (executive_summary, full_markdown) render as-is — Sonnet's job.
// ---------------------------------------------------------------------------
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function yesterdayIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return isoDate(d)
}

/**
 * Format YYYY-MM-DD into long Spanish date (accents stripped).
 * Example: "2026-05-17" -> "Sabado 17 de mayo 2026".
 */
function formatBriefDate(yyyyMmDd: string): string {
  // Parse manually to avoid TZ surprises (Date('2026-05-17') -> UTC midnight).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(yyyyMmDd)
  if (!m) return yyyyMmDd
  const [, y, mo, day] = m
  const d = new Date(Number(y), Number(mo) - 1, Number(day))
  if (Number.isNaN(d.getTime())) return yyyyMmDd
  const fmt = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
  // Intl returns "sábado, 17 de mayo de 2026" — strip accents + tidy.
  return stripAccents(fmt)
}

// ---------------------------------------------------------------------------
// Known-available dates (verified Track 1 Fase 9 prep).
// ---------------------------------------------------------------------------

const KNOWN_DATES: Record<string, string[]> = {
  // Carlos
  '65dc08f0-8fe9-463f-880f-36b5da66ebe6': ['2026-05-17', '2026-05-08'],
  // Astudillo
  '312af85e-af56-4304-85e2-be0721ffda14': ['2026-05-17'],
}

// ---------------------------------------------------------------------------
// Loose-shape helpers for DailyBrief (typed as Record<string, unknown>).
// ---------------------------------------------------------------------------

type AnyRec = Record<string, unknown>

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function asRecord(v: unknown): AnyRec | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRec) : null
}

interface Recommendation {
  action: string
  platform?: string | null
  priority?: string | null
  rationale?: string | null
  optimal_time?: string | null
}

function parseRecommendation(v: unknown): Recommendation | null {
  const r = asRecord(v)
  if (!r) return null
  const action = asString(r.action)
  if (!action) return null
  return {
    action,
    platform: asString(r.platform),
    priority: asString(r.priority),
    rationale: asString(r.rationale),
    optimal_time: asString(r.optimal_time),
  }
}

interface CrisisAlert {
  title: string
  severity?: string | null
  confidence?: number | null
  description?: string | null
  trigger_topics?: string[]
  suggested_response_window?: string | null
}

function parseCrisisAlert(v: unknown): CrisisAlert | null {
  const r = asRecord(v)
  if (!r) return null
  const title = asString(r.title)
  if (!title) return null
  const trigger = asArray(r.trigger_topics).filter(
    (x): x is string => typeof x === 'string',
  )
  const conf = typeof r.confidence === 'number' ? r.confidence : null
  return {
    title,
    severity: asString(r.severity),
    confidence: conf,
    description: asString(r.description),
    trigger_topics: trigger,
    suggested_response_window: asString(r.suggested_response_window),
  }
}

// ---------------------------------------------------------------------------
// Priority/severity styling
// ---------------------------------------------------------------------------

function priorityVariant(
  p: string | null | undefined,
): 'positive' | 'mixed' | 'negative' | 'neutral' {
  const v = (p ?? '').toLowerCase()
  if (v === 'high' || v === 'alta' || v === 'critical') return 'negative'
  if (v === 'medium' || v === 'med' || v === 'media') return 'mixed'
  if (v === 'low' || v === 'baja') return 'positive'
  return 'neutral'
}

function severityVariant(
  s: string | null | undefined,
): 'positive' | 'mixed' | 'negative' | 'neutral' {
  const v = (s ?? '').toLowerCase()
  if (v === 'critical' || v === 'high' || v === 'alta') return 'negative'
  if (v === 'warning' || v === 'medium' || v === 'media' || v === 'watch')
    return 'mixed'
  if (v === 'info' || v === 'low' || v === 'baja') return 'neutral'
  return 'neutral'
}

// ---------------------------------------------------------------------------
// Briefing page
// ---------------------------------------------------------------------------

export function Briefing() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id
  const displayName = client.display_name

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Prefer known date for current client, else yesterday.
    const known = KNOWN_DATES[politicianId]
    return known && known.length > 0 ? known[0]! : yesterdayIso()
  })

  const briefQ = useDailyBrief(politicianId, selectedDate)

  const knownForClient = KNOWN_DATES[politicianId] ?? []
  const todayIso = isoDate(new Date())
  const maxIso = todayIso

  // Parse loose backend shape into typed locals.
  const brief = briefQ.data as AnyRec | undefined
  const executiveSummary = asString(brief?.executive_summary)
  const keyTopics = asArray(brief?.key_topics).filter(
    (x): x is string => typeof x === 'string',
  )
  const recommendations = useMemo(
    () =>
      asArray(brief?.recommendations)
        .map(parseRecommendation)
        .filter((r): r is Recommendation => r !== null),
    [brief],
  )
  const crisisAlerts = useMemo(
    () =>
      asArray(brief?.crisis_alerts)
        .map(parseCrisisAlert)
        .filter((c): c is CrisisAlert => c !== null),
    [brief],
  )
  const fullMarkdown =
    asString(brief?.full_markdown) ?? asString(brief?.full_brief_md) ?? null
  const generatedByModel = asString(brief?.generated_by_model)
  const briefDate = asString(brief?.brief_date) ?? selectedDate

  // Detect 404 vs other errors. apiGet rejects with `Error` containing status.
  const errorMsg = briefQ.error instanceof Error ? briefQ.error.message : ''
  const is404 = /\b404\b/.test(errorMsg) || /not\s*found/i.test(errorMsg)

  function handleExport() {
    // REGLA 4: no fake. Label clearly as placeholder (Wave D).
    window.alert('Export PDF — proximamente Wave D')
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Briefing diario"
        subtitle={stripAccents(
          `Resumen ejecutivo AI-generado dia por dia — ${displayName}`,
        )}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            aria-label="Export PDF placeholder"
          >
            <FileDown size={14} aria-hidden="true" />
            Export PDF
            <span className="ml-1 text-[10px] uppercase tracking-wide text-ink-muted">
              (Wave D)
            </span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left column: date picker + known dates */}
        <aside className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-ink mb-2">Fecha</h3>
            <label
              htmlFor="brief-date"
              className="block text-xs text-ink-muted mb-1"
            >
              Seleccionar dia
            </label>
            <input
              id="brief-date"
              type="date"
              value={selectedDate}
              max={maxIso}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={cn(
                'w-full rounded-md border border-border bg-surface px-2 py-1.5',
                'text-sm text-ink font-mono',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            />
            <p className="mt-2 text-xs text-ink-subtle italic">
              Hoy ({todayIso}) suele devolver 404 hasta que corre el cron por la
              tarde UTC.
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-ink mb-2">
              Fechas disponibles
            </h3>
            {knownForClient.length === 0 ? (
              <p className="text-xs text-ink-muted">
                Sin fechas verificadas para {displayName}.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {knownForClient.map((d) => {
                  const active = d === selectedDate
                  return (
                    <li key={d}>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-mono border transition-colors',
                          active
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink border-border hover:bg-surface-elevated',
                        )}
                        aria-pressed={active}
                      >
                        {d}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-2 text-xs text-ink-subtle italic">
              Verificado 2026-05-18 contra /daily-brief.
            </p>
          </Card>
        </aside>

        {/* Right column: brief panel */}
        <section className="min-w-0">
          {briefQ.isLoading ? (
            <SkeletonChart />
          ) : briefQ.isError ? (
            is404 ? (
              <Card>
                <EmptyState
                  title="Brief no generado para esta fecha aun"
                  description={stripAccents(
                    `No existe daily brief para ${displayName} en ${selectedDate}. Selecciona otra fecha o espera el cron diario.`,
                  )}
                />
              </Card>
            ) : (
              <Card>
                <ErrorState
                  description={stripAccents(
                    errorMsg || 'No pudimos cargar el brief. Intenta de nuevo.',
                  )}
                  onRetry={() => briefQ.refetch()}
                />
              </Card>
            )
          ) : !brief ? (
            <Card>
              <EmptyState
                title="Sin datos"
                description="La respuesta del backend vino vacia."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header card */}
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-mono uppercase tracking-wide text-ink-muted">
                      Brief del dia
                    </div>
                    <h2 className="mt-0.5 text-xl font-semibold text-ink">
                      {formatBriefDate(briefDate)}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {generatedByModel ? (
                      <Badge variant="accent" className="gap-1.5">
                        <Sparkles size={12} aria-hidden="true" />
                        {generatedByModel}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {keyTopics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {keyTopics.slice(0, 12).map((t) => (
                      <Badge key={t} variant="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Card>

              {/* Executive summary */}
              <Card>
                <h3 className="text-sm font-semibold text-ink mb-2">
                  Resumen ejecutivo
                </h3>
                {executiveSummary ? (
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                    {executiveSummary}
                  </p>
                ) : (
                  <p className="text-sm text-ink-muted italic">
                    Sin resumen ejecutivo en la respuesta.
                  </p>
                )}
              </Card>

              {/* Recommendations */}
              <Card>
                <h3 className="text-sm font-semibold text-ink mb-3">
                  Recomendaciones
                </h3>
                {recommendations.length === 0 ? (
                  <p className="text-sm text-ink-muted italic">
                    Sin recomendaciones para esta fecha.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recommendations.map((r, i) => (
                      <li
                        key={`${r.action}-${i}`}
                        className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {r.priority ? (
                            <Badge variant={priorityVariant(r.priority)}>
                              {r.priority}
                            </Badge>
                          ) : null}
                          {r.platform ? (
                            <Badge variant="default">{r.platform}</Badge>
                          ) : null}
                          {r.optimal_time ? (
                            <span className="text-xs font-mono text-ink-muted">
                              {r.optimal_time}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm text-ink leading-relaxed">
                          {r.action}
                        </div>
                        {r.rationale ? (
                          <div className="mt-1 text-xs text-ink-muted leading-relaxed">
                            {r.rationale}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Crisis alerts */}
              <Card>
                <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <AlertOctagon
                    size={16}
                    className="text-sentiment-negative"
                    aria-hidden="true"
                  />
                  Alertas de crisis
                </h3>
                {crisisAlerts.length === 0 ? (
                  <p className="text-sm text-ink-muted italic">
                    Sin alertas de crisis activas para esta fecha.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {crisisAlerts.map((c, i) => (
                      <li
                        key={`${c.title}-${i}`}
                        className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {c.severity ? (
                            <Badge variant={severityVariant(c.severity)}>
                              {c.severity}
                            </Badge>
                          ) : null}
                          {typeof c.confidence === 'number' ? (
                            <span className="text-xs font-mono text-ink-muted tabular-nums">
                              {(c.confidence * 100).toFixed(0)}% confianza
                            </span>
                          ) : null}
                          {c.suggested_response_window ? (
                            <span className="text-xs font-mono text-ink-muted">
                              ventana: {c.suggested_response_window}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium text-ink">
                          {c.title}
                        </div>
                        {c.description ? (
                          <div className="mt-1 text-xs text-ink-muted leading-relaxed">
                            {c.description}
                          </div>
                        ) : null}
                        {c.trigger_topics && c.trigger_topics.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.trigger_topics.map((t) => (
                              <Badge key={t} variant="neutral">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Full markdown — collapsible */}
              <Card>
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-ink select-none">
                    Markdown completo
                  </summary>
                  <div
                    className={cn(
                      'mt-3 text-sm text-ink leading-relaxed',
                      'prose prose-sm max-w-none',
                      // Minimal manual styling — project doesn't ship @tailwindcss/typography
                      '[&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2',
                      '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2',
                      '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
                      '[&_p]:my-2',
                      '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
                      '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
                      '[&_li]:my-1',
                      '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-surface [&_code]:px-1 [&_code]:rounded',
                      '[&_strong]:font-semibold',
                      '[&_a]:text-primary [&_a]:underline',
                    )}
                  >
                    {fullMarkdown ? (
                      <ReactMarkdown>{fullMarkdown}</ReactMarkdown>
                    ) : (
                      <p className="text-ink-muted italic">
                        Sin markdown completo en la respuesta.
                      </p>
                    )}
                  </div>
                </details>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Briefing
