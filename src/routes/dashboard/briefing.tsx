import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonChart } from '../../components/states/LoadingSkeleton'
import { ExportButton } from '../../components/data-display/ExportButton'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { useAvailableDates, useDailyBrief } from '../../lib/api/queries'
import { stripAccents } from '../../lib/utils/stripAccents'
import { cn } from '../../lib/utils/cn'

// ===========================================================================
// REGLA 79: cero acentos ni n-con-tilde en strings de UI que controlamos
// (chrome/labels). Los strings del backend (executive_summary, full_markdown)
// se renderizan tal cual — eso es trabajo del modelo, no nuestro.
// Mockup 10 (10-briefing-diario.html) como referencia visual exacta.
// ===========================================================================

// ---------------------------------------------------------------------------
// Date helpers — parseo manual para evitar sorpresas de TZ.
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

/** "2026-05-17" -> Date local (medianoche local, no UTC). */
function parseIso(yyyyMmDd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(yyyyMmDd)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

const WEEKDAYS_ES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
] as const

const DOW_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const

function cap(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s
}

/** "2026-05-17" -> "Domingo 17 de mayo de 2026" (sin acentos). */
function formatBriefDateLong(yyyyMmDd: string): string {
  const d = parseIso(yyyyMmDd)
  if (!d) return yyyyMmDd
  const wd = WEEKDAYS_ES[d.getDay()]!
  return cap(`${wd} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]!} de ${d.getFullYear()}`)
}

/** "2026-05-17" -> "dom 17 may" para la lista de recientes (sin acentos). */
function formatBriefDateShort(yyyyMmDd: string): string {
  const d = parseIso(yyyyMmDd)
  if (!d) return yyyyMmDd
  const wd = WEEKDAYS_ES[d.getDay()]!.slice(0, 3)
  const mo = MONTHS_ES[d.getMonth()]!.slice(0, 3)
  return `${wd} ${d.getDate()} ${mo}`
}

/** "Mayo 2026" para el encabezado del calendario (sin acentos). */
function formatMonthLabel(year: number, monthIdx: number): string {
  return `${cap(MONTHS_ES[monthIdx]!)} ${year}`
}

// ---------------------------------------------------------------------------
// Fechas conocidas con brief generado (verificadas contra /daily-brief).
// Fallback honesto si available-dates aun no esta vivo (API PENDIENTE).
// ---------------------------------------------------------------------------

const KNOWN_DATES: Record<string, string[]> = {
  // Carlos Orvananos
  '65dc08f0-8fe9-463f-880f-36b5da66ebe6': ['2026-05-17', '2026-05-08'],
  // Astudillo
  '312af85e-af56-4304-85e2-be0721ffda14': ['2026-05-17'],
}

// ---------------------------------------------------------------------------
// Loose-shape helpers para DailyBrief (tipado como Record<string, unknown>).
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
// Variantes de Badge por prioridad / severidad.
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
  return 'neutral'
}

// ===========================================================================
// BriefCalendar — panel sticky con grid mensual + lista de recientes.
// Enciende los dias con brief (useAvailableDates). API PENDIENTE: si el
// endpoint aun no responde, degrada a las fechas conocidas (KNOWN_DATES) y
// muestra el grid igual; nunca inventa puntos en dias sin brief verificado.
// ===========================================================================

interface BriefCalendarProps {
  selectedDate: string
  onSelect: (iso: string) => void
  /** Fechas con brief disponible (YYYY-MM-DD). */
  availableDates: string[]
  /** El endpoint available-dates aun no esta vivo -> usamos fallback. */
  isDegraded: boolean
}

function BriefCalendar({
  selectedDate,
  onSelect,
  availableDates,
  isDegraded,
}: BriefCalendarProps) {
  // Mes mostrado: arranca en el mes de la fecha seleccionada.
  const initial = parseIso(selectedDate) ?? new Date()
  const [view, setView] = useState<{ year: number; month: number }>({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  })

  const availableSet = useMemo(() => new Set(availableDates), [availableDates])

  // Lista de recientes: fechas disponibles ordenadas desc, top 5.
  const recent = useMemo(
    () =>
      [...availableDates]
        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
        .slice(0, 5),
    [availableDates],
  )

  const firstDow = new Date(view.year, view.month, 1).getDay() // 0 Dom..6 Sab
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const todayIsoStr = isoDate(new Date())

  function goPrev() {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    )
  }
  function goNext() {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    )
  }

  return (
    <Card className="lg:sticky lg:top-20" aria-label="Calendario de briefings">
      {/* Encabezado mes + navegacion */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Mes anterior"
          className={cn(
            'grid h-7 w-7 place-items-center rounded-md text-ink-muted',
            'hover:bg-sunken hover:text-ink transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <b className="text-sm font-bold text-ink">
          {formatMonthLabel(view.year, view.month)}
        </b>
        <button
          type="button"
          onClick={goNext}
          aria-label="Mes siguiente"
          className={cn(
            'grid h-7 w-7 place-items-center rounded-md text-ink-muted',
            'hover:bg-sunken hover:text-ink transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Grid del mes */}
      <div className="grid grid-cols-7 gap-[3px]" role="grid">
        {DOW_SHORT.map((d, i) => (
          <span
            key={`dow-${i}`}
            className="py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-ink-subtle"
            aria-hidden="true"
          >
            {d}
          </span>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <span key={`empty-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const iso = `${view.year}-${pad(view.month + 1)}-${pad(day)}`
          const has = availableSet.has(iso)
          const isSel = iso === selectedDate
          const isToday = iso === todayIsoStr
          const isFuture = iso > todayIsoStr
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              disabled={isFuture}
              aria-pressed={isSel}
              aria-label={`${formatBriefDateShort(iso)}${has ? ' con brief' : ''}`}
              className={cn(
                'relative grid aspect-square place-items-center rounded-lg text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isFuture && 'opacity-30 cursor-not-allowed',
                !isSel && !isFuture && 'text-ink-muted hover:bg-sunken hover:text-ink',
                !isSel && isToday && !isFuture && 'text-ink font-semibold',
                isSel && 'bg-primary text-ink-on-primary font-bold',
              )}
            >
              {day}
              {has ? (
                <span
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    isSel ? 'bg-ink-on-primary' : 'bg-primary',
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Lista de recientes */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Briefings recientes
        </div>
        {recent.length === 0 ? (
          <p className="px-2 text-xs text-ink-muted">
            Sin briefings recientes.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {recent.map((iso) => {
              const active = iso === selectedDate
              return (
                <li key={iso}>
                  <button
                    type="button"
                    onClick={() => onSelect(iso)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      active
                        ? 'bg-sunken text-ink'
                        : 'text-ink-muted hover:bg-sunken hover:text-ink',
                    )}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span
                      className="h-1.5 w-1.5 flex-none rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {formatBriefDateShort(iso)}
                    {iso === todayIsoStr ? (
                      <span className="text-ink-subtle"> - hoy</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {isDegraded ? (
          // API PENDIENTE: el endpoint available-dates no esta vivo todavia.
          <p className="mt-3 px-1 text-[11px] italic leading-snug text-ink-subtle">
            Fechas disponibles desde verificacion local. La lista completa se
            encendera cuando el backend exponga available-dates.
          </p>
        ) : null}
      </div>
    </Card>
  )
}

// ===========================================================================
// BriefReader — documento del brief (cabecera + secciones + markdown crudo).
// ===========================================================================

interface BriefReaderProps {
  brief: AnyRec
  briefDate: string
}

function BriefReader({ brief, briefDate }: BriefReaderProps) {
  const [showRaw, setShowRaw] = useState(false)

  const executiveSummary = asString(brief.executive_summary)
  const keyTopics = asArray(brief.key_topics).filter(
    (x): x is string => typeof x === 'string',
  )
  const recommendations = useMemo(
    () =>
      asArray(brief.recommendations)
        .map(parseRecommendation)
        .filter((r): r is Recommendation => r !== null),
    [brief],
  )
  const crisisAlerts = useMemo(
    () =>
      asArray(brief.crisis_alerts)
        .map(parseCrisisAlert)
        .filter((c): c is CrisisAlert => c !== null),
    [brief],
  )
  const fullMarkdown =
    asString(brief.full_markdown) ?? asString(brief.full_brief_md) ?? null
  const generatedByModel = asString(brief.generated_by_model)
  const generatedAt = asString(brief.generated_at)
  const generatedTime = generatedAt
    ? generatedAt.slice(11, 16) || null // "HH:MM" si viene ISO
    : null

  return (
    <Card padded={false} className="overflow-hidden" id="brief-print-scope">
      {/* Cabecera del documento */}
      <div className="border-b border-border-subtle px-6 py-5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          Brief del dia
        </div>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-ink">
          {formatBriefDateLong(briefDate)}
        </h2>
        {generatedByModel ? (
          <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            {generatedByModel}
            {generatedTime ? ` - generado ${generatedTime}` : null}
          </span>
        ) : null}
      </div>

      <div className="px-6 py-6">
        {/* Chips de temas clave */}
        {keyTopics.length > 0 ? (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {keyTopics.slice(0, 12).map((t) => (
              <Badge key={t} variant="neutral">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Resumen ejecutivo */}
        <section className="mb-7">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span className="h-[18px] w-1 rounded-sm bg-primary" aria-hidden="true" />
            Resumen ejecutivo
          </h3>
          {executiveSummary ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {executiveSummary}
            </p>
          ) : (
            <p className="text-sm italic text-ink-subtle">
              Sin resumen ejecutivo en la respuesta.
            </p>
          )}
        </section>

        {/* Recomendaciones */}
        <section className="mb-7">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span className="h-[18px] w-1 rounded-sm bg-primary" aria-hidden="true" />
            Recomendaciones
          </h3>
          {recommendations.length === 0 ? (
            <p className="text-sm italic text-ink-subtle">
              Sin recomendaciones para esta fecha.
            </p>
          ) : (
            <ul className="space-y-3">
              {recommendations.map((r, i) => (
                <li
                  key={`${r.action}-${i}`}
                  className="rounded-md border border-border-subtle bg-sunken p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {r.platform ?? 'Multi'}
                    </span>
                    {r.priority ? (
                      <Badge variant={priorityVariant(r.priority)}>
                        {r.priority}
                      </Badge>
                    ) : null}
                    {r.optimal_time ? (
                      <span className="font-mono text-xs text-ink-subtle">
                        {r.optimal_time}
                      </span>
                    ) : null}
                  </div>
                  <div className="mb-2 text-sm leading-relaxed text-ink">
                    {r.action}
                  </div>
                  {r.rationale ? (
                    <div className="flex gap-1.5 text-xs leading-relaxed text-ink-subtle">
                      <b className="font-semibold text-primary">Por que:</b>
                      <span>{r.rationale}</span>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Alertas de crisis */}
        <section className="mb-7">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span className="h-[18px] w-1 rounded-sm bg-primary" aria-hidden="true" />
            Alertas de crisis
          </h3>
          {crisisAlerts.length === 0 ? (
            <p className="text-sm italic text-ink-subtle">
              Sin alertas de crisis activas para esta fecha.
            </p>
          ) : (
            <ul className="space-y-3">
              {crisisAlerts.map((c, i) => (
                <li
                  key={`${c.title}-${i}`}
                  className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-4"
                >
                  <AlertTriangle
                    size={20}
                    className="mt-0.5 flex-none text-warning"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.severity ? (
                        <Badge variant={severityVariant(c.severity)}>
                          {c.severity}
                        </Badge>
                      ) : null}
                      {typeof c.confidence === 'number' ? (
                        <span className="font-mono text-xs tabular-nums text-ink-subtle">
                          z={c.confidence.toFixed(2)}
                        </span>
                      ) : null}
                      {c.suggested_response_window ? (
                        <span className="font-mono text-xs text-ink-subtle">
                          ventana: {c.suggested_response_window}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink">
                      {c.title}
                    </div>
                    {c.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        {c.description}
                      </p>
                    ) : null}
                    {c.trigger_topics && c.trigger_topics.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.trigger_topics.map((t) => (
                          <Badge key={t} variant="neutral">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Markdown completo — colapsable */}
        <div>
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            aria-expanded={showRaw}
            className={cn(
              'inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm',
            )}
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn(
                'transition-transform motion-reduce:transition-none',
                showRaw && 'rotate-180',
              )}
            />
            {showRaw ? 'Ocultar markdown completo' : 'Ver markdown completo'}
          </button>
          {showRaw ? (
            fullMarkdown ? (
              <div
                className={cn(
                  'mt-2 rounded-md border border-border-subtle bg-sunken p-4',
                  'text-sm leading-relaxed text-ink-muted',
                  'prose prose-sm max-w-none',
                  '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-ink [&_h1]:mt-4 [&_h1]:mb-2',
                  '[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mt-3 [&_h2]:mb-2',
                  '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-3 [&_h3]:mb-1',
                  '[&_p]:my-2',
                  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
                  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
                  '[&_li]:my-1',
                  '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-card [&_code]:px-1 [&_code]:rounded',
                  '[&_strong]:font-semibold [&_strong]:text-ink',
                  '[&_a]:text-primary [&_a]:underline',
                )}
              >
                <ReactMarkdown>{fullMarkdown}</ReactMarkdown>
              </div>
            ) : (
              <p className="mt-2 rounded-md border border-border-subtle bg-sunken p-4 text-sm italic text-ink-subtle">
                Sin markdown completo en la respuesta.
              </p>
            )
          ) : null}
        </div>
      </div>
    </Card>
  )
}

// ===========================================================================
// Briefing page
// ===========================================================================

export function Briefing() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id
  const displayName = client.display_name

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const known = KNOWN_DATES[politicianId]
    return known && known.length > 0 ? known[0]! : yesterdayIso()
  })

  const briefQ = useDailyBrief(politicianId, selectedDate)
  // API PENDIENTE: available-dates puede no estar vivo. Si falla, degradamos
  // al set conocido y marcamos el panel como degradado (sin inventar puntos).
  const datesQ = useAvailableDates(politicianId)

  const knownForClient = KNOWN_DATES[politicianId] ?? []
  const liveDates = useMemo(() => {
    const d = datesQ.data?.dates
    return Array.isArray(d) ? d.filter((x) => typeof x === 'string') : []
  }, [datesQ.data])

  const isDatesDegraded = datesQ.isError || (!datesQ.isLoading && liveDates.length === 0)
  const availableDates = isDatesDegraded ? knownForClient : liveDates

  // Parse loose backend shape.
  const brief = briefQ.data as AnyRec | undefined
  const briefDate = (asString(brief?.brief_date) ?? selectedDate) as string

  // Detect 404 vs otros errores (apiGet rechaza con Error que incluye status).
  const errorMsg = briefQ.error instanceof Error ? briefQ.error.message : ''
  const is404 = /\b404\b/.test(errorMsg) || /not\s*found/i.test(errorMsg)

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Briefing diario"
        subtitle={stripAccents(
          `Resumen ejecutivo AI-generado cada manana, listo para leer o exportar a PDF. ${displayName}`,
        )}
        actions={
          <ExportButton
            formats={['pdf']}
            filename={`polaris-brief-${selectedDate}`}
            printTargetId="brief-print-scope"
            variant="primary"
            size="sm"
            disabled={!brief || briefQ.isLoading}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
        {/* Columna izquierda: calendario + recientes */}
        <BriefCalendar
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          availableDates={availableDates}
          isDegraded={isDatesDegraded}
        />

        {/* Columna derecha: documento del brief */}
        <section className="min-w-0">
          {briefQ.isLoading ? (
            <SkeletonChart />
          ) : briefQ.isError ? (
            is404 ? (
              <Card>
                <EmptyState
                  title="Brief no generado para esta fecha aun"
                  description={stripAccents(
                    `No existe daily brief para ${displayName} en ${formatBriefDateLong(
                      selectedDate,
                    )}. Selecciona otra fecha en el calendario o espera el cron diario.`,
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
            <BriefReader brief={brief} briefDate={briefDate} />
          )}
        </section>
      </div>
    </div>
  )
}

export default Briefing
