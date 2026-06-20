/**
 * Pantalla "Theming Showcase" (mockup 13-theming-showcase).
 *
 * Owner: routes/dashboard/showcase.tsx. Demo de marketing del theming
 * multi-tenant: previsualiza las 8 paletas de partido re-tintando toda la
 * superficie en vivo (tiles + grid de paletas + auto-play opcional), con la
 * transicion @property de ~420ms ya definida en index.css.
 *
 * Como re-tinta (sin tocar archivos compartidos):
 *   El theming engine vive en <html data-party="..."> + tokens inline
 *   --polaris-primary y --polaris-accent (los setea ThemeProvider). Esta pantalla
 *   replica ese mismo gesto localmente (setea data-party + los 4 tokens en el
 *   <html>) para poder previsualizar las 8 paletas, no solo los 2 clientes
 *   registrados en el store. data-animate-theme (que ya pone ThemeProvider al
 *   boot) hace que los 4 tokens animen via @property. Al desmontar restauramos
 *   el theme real del cliente activo (useClientTheme().client) para no dejar la
 *   app pegada en una paleta de demo.
 *
 * setParty del store solo acepta los ids de cliente registrados (orvananos /
 * astudillo); para las 8 paletas re-tintamos localmente. Donde el partido del
 * preview coincide con un cliente real tambien sincronizamos el store.
 *
 * Honestidad de datos: el preview (KPIs, sparkline, chips) es 100% sintetico
 * (es una demo visual del theming, no data real) -> <DemoBadge/>. REGLA 79:
 * cero acentos / n-con-tilde en strings visibles.
 *
 * 4 estados: esta pantalla es estatica (no consume endpoints) -> siempre data.
 * Responsive mobile-first. Respeta prefers-reduced-motion (auto-play se apaga
 * y la transicion cae a un set instantaneo, igual que ThemeProvider).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Pause, Play } from 'lucide-react'

import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { DemoBadge } from '../../components/states/DemoBadge'
import { KPICard } from '../../components/data-display/KPICard'
import { Sparkline } from '../../components/data-display/Sparkline'
import { useClientTheme } from '../../features/client-theme/useClientTheme'

// ---------------------------------------------------------------------------
// Registro local de las 8 paletas. Valores espejo de [data-party] en index.css
// (fuente de verdad visual). Se mantienen aqui para poder re-tintar el preview
// completo sin depender del store (que solo conoce 2 clientes). avatar/name son
// del mockup: data sintetica de demostracion.
// ---------------------------------------------------------------------------

type PartySlug =
  | 'pan'
  | 'morena'
  | 'pri'
  | 'mc'
  | 'pvem'
  | 'pt'
  | 'prd'
  | 'ind'

type Palette = {
  slug: PartySlug
  label: string
  full: string
  /** Persona del preview (sintetica). */
  name: string
  meta: string
  initials: string
  primary: string
  primaryDark: string
  primaryLight: string
  accent: string
  /** PRD usa texto oscuro sobre primario (contraste AA), espeja index.css. */
  textOnPrimary?: string
  /** Cliente real del store con esta paleta (sincroniza setParty). */
  clientId?: string
}

const PALETTES: Palette[] = [
  {
    slug: 'pan',
    label: 'PAN',
    full: 'Accion Nacional',
    name: 'Carlos Orvananos',
    meta: 'Cuajimalpa, CDMX',
    initials: 'CO',
    primary: '#0066CC',
    primaryDark: '#003D7A',
    primaryLight: '#4D94DB',
    accent: '#F4A53A',
    clientId: 'orvananos',
  },
  {
    slug: 'morena',
    label: 'MORENA',
    full: 'Regeneracion Nac.',
    name: 'Laura Beltran',
    meta: 'Cliente demo',
    initials: 'LB',
    primary: '#8B2332',
    primaryDark: '#5C0A14',
    primaryLight: '#B33A48',
    accent: '#C9A961',
  },
  {
    slug: 'mc',
    label: 'MC',
    full: 'Movimiento Ciud.',
    name: 'Diego Salas',
    meta: 'Cliente demo',
    initials: 'DS',
    primary: '#FF6F00',
    primaryDark: '#C75500',
    primaryLight: '#FF9E40',
    accent: '#424242',
  },
  {
    slug: 'pri',
    label: 'PRI',
    full: 'Rev. Institucional',
    name: 'Cliente demo',
    meta: 'PRI',
    initials: 'PR',
    primary: '#006847',
    primaryDark: '#004D34',
    primaryLight: '#1A8C66',
    accent: '#CE1126',
  },
  {
    slug: 'pvem',
    label: 'PVEM',
    full: 'Verde Ecologista',
    name: 'Ricardo Astudillo',
    meta: 'Cliente demo',
    initials: 'RA',
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    primaryLight: '#66BB6A',
    accent: '#FDD835',
    clientId: 'astudillo',
  },
  {
    slug: 'pt',
    label: 'PT',
    full: 'Del Trabajo',
    name: 'Cliente demo',
    meta: 'PT',
    initials: 'PT',
    primary: '#D32F2F',
    primaryDark: '#9A0007',
    primaryLight: '#FF6659',
    accent: '#FBC02D',
  },
  {
    slug: 'prd',
    label: 'PRD',
    full: 'Rev. Democratica',
    name: 'Cliente demo',
    meta: 'PRD',
    initials: 'PD',
    primary: '#F2A900',
    primaryDark: '#C18600',
    primaryLight: '#FFD64D',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1A1A',
  },
  {
    slug: 'ind',
    label: 'IND',
    full: 'Independiente',
    name: 'Cliente demo',
    meta: 'Sin partido',
    initials: 'IN',
    primary: '#5E35B1',
    primaryDark: '#4527A0',
    primaryLight: '#9575CD',
    accent: '#FFB300',
  },
]

const AUTOPLAY_MS = 1600

function gradientFor(p: Palette): string {
  return `linear-gradient(135deg, ${p.primaryDark} 0%, ${p.primary} 50%, ${p.primaryLight} 100%)`
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type StartViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => unknown
}

/**
 * Aplica una paleta al <html>: data-party + los 4 tokens de marca inline.
 * Espeja applyClientToDom de ThemeProvider para que la transicion @property
 * (420ms) y todos los componentes que leen --polaris-* se re-tinten juntos.
 */
function applyPaletteToDom(p: {
  slug: PartySlug
  primary: string
  primaryDark: string
  primaryLight: string
  accent: string
  textOnPrimary?: string
}): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-party', p.slug)
  root.style.setProperty('--polaris-primary', p.primary)
  root.style.setProperty('--polaris-primary-dark', p.primaryDark)
  root.style.setProperty('--polaris-primary-light', p.primaryLight)
  root.style.setProperty('--polaris-accent', p.accent)
  // PRD: texto oscuro sobre primario. Para el resto limpiamos el override para
  // que vuelva a heredar el token base del tema (light/dark).
  if (p.textOnPrimary) {
    root.style.setProperty('--text-on-primary', p.textOnPrimary)
  } else {
    root.style.removeProperty('--text-on-primary')
  }
}

// Serie sintetica para el sparkline del preview (demo visual).
const PREVIEW_SPARK = [42, 46, 44, 58, 54, 70, 64, 80, 72, 88, 84, 100]

export default function Showcase() {
  const { client, setParty } = useClientTheme()

  // Paleta activa del preview. Arranca en la del cliente real activo si existe.
  const initialSlug = useMemo<PartySlug>(() => {
    const match = PALETTES.find((p) => p.clientId === client.id)
    return match ? match.slug : (client.party_slug as PartySlug)
  }, [client.id, client.party_slug])

  const [activeSlug, setActiveSlug] = useState<PartySlug>(initialSlug)
  const [autoplay, setAutoplay] = useState(false)
  const reduced = useRef(prefersReducedMotion())

  // Snapshot del theme real del cliente para restaurar al desmontar. Se captura
  // una sola vez al montar (antes de que la demo lo sobre-escriba).
  const restoreRef = useRef<{
    slug: PartySlug
    primary: string
    primaryDark: string
    primaryLight: string
    accent: string
    textOnPrimary?: string
  }>({
    slug: client.party_slug as PartySlug,
    primary: client.primary,
    primaryDark: client.primary_dark,
    primaryLight: client.primary_light,
    accent: client.accent,
  })

  const active = useMemo(
    () => PALETTES.find((p) => p.slug === activeSlug) ?? PALETTES[0]!,
    [activeSlug],
  )

  /**
   * Re-tinta a la paleta dada con la misma logica que ThemeProvider.
   * Si la paleta corresponde a un cliente real, sincroniza el store (setParty
   * ya re-tinta con su propia View Transition). Si no, re-tinta el <html>
   * manualmente, usando View Transition cuando existe y no hay reduced-motion.
   */
  const retint = useCallback((p: Palette) => {
    if (p.clientId) {
      setParty(p.clientId)
      return
    }
    const doc = document as StartViewTransitionDoc
    if (typeof doc.startViewTransition === 'function' && !reduced.current) {
      doc.startViewTransition(() => applyPaletteToDom(p))
    } else {
      applyPaletteToDom(p)
    }
  }, [setParty])

  const applyPalette = useCallback((p: Palette) => {
    setActiveSlug(p.slug)
    retint(p)
  }, [retint])

  // Restaura el theme real del cliente al desmontar la pantalla.
  useEffect(() => {
    const snapshot = restoreRef.current
    return () => {
      applyPaletteToDom(snapshot)
    }
  }, [])

  // Auto-play: cicla las 8 paletas. Se apaga bajo prefers-reduced-motion.
  useEffect(() => {
    if (!autoplay || reduced.current) return
    const timer = window.setInterval(() => {
      setActiveSlug((curr) => {
        const idx = PALETTES.findIndex((p) => p.slug === curr)
        const next = PALETTES[(idx + 1) % PALETTES.length]!
        retint(next)
        return next.slug
      })
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [autoplay, retint])

  const reducedNow = reduced.current

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      {/* Hero */}
      <header className="pt-8 pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          Multi-tenant - El diferenciador
        </p>
        <h1 className="mt-3 max-w-[18ch] text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Una herramienta. <span className="text-primary">Tu</span> marca.
        </h1>
        <p className="mt-3 max-w-[60ch] text-sm text-ink-subtle sm:text-base">
          POLARIS no es generico. Cuando tu cliente abre su radar, lo ve en los
          colores de su partido sobre una base neutral premium. Elige un partido
          abajo, o activa el auto-play, y mira como todo se re-tinta en vivo.
        </p>
      </header>

      {/* Stage: preview en vivo + controles */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Live preview */}
        <Card padded={false} className="relative overflow-hidden">
          <div className="absolute right-3 top-3 z-10">
            <DemoBadge label="DEMO" />
          </div>

          {/* Preview hero con gradiente de marca */}
          <div
            className="relative px-5 py-5 text-white"
            style={{ background: gradientFor(active) }}
          >
            <div className="relative flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white ring-2 ring-white/25"
                style={{ background: active.primaryDark }}
                aria-hidden="true"
              >
                {active.initials}
              </span>
              <span className="flex flex-col leading-tight">
                <b className="text-base font-bold">{active.name}</b>
                <span className="text-[11px] text-white/80">{active.meta}</span>
              </span>
              <span
                className="ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                }}
              >
                {active.label}
              </span>
            </div>
          </div>

          {/* Preview body */}
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-2.5">
              <KPICard
                label="PPI"
                value={62.38}
                format="score"
                delta={{ value: 3.2, period: '30d' }}
              />
              <KPICard
                label="SoV"
                value={44.7}
                unit="%"
                format="percent"
                delta={{ value: 2.1, period: '30d' }}
              />
              <KPICard
                label="Menciones"
                value={1333}
                format="number"
                delta={{ value: 8, period: '30d' }}
              />
            </div>

            <div className="rounded-xs border border-border-subtle bg-sunken p-2">
              <Sparkline
                data={PREVIEW_SPARK}
                tone="primary"
                fill
                height={90}
                strokeWidth={2}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="sm">
                Ver briefing
              </Button>
              <Button variant="ghost" size="sm">
                Exportar
              </Button>
              <Badge variant="accent">obras</Badge>
              <Badge variant="accent">baches</Badge>
            </div>
          </div>
        </Card>

        {/* Controles */}
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Elige el partido del cliente
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {PALETTES.map((p) => {
              const pressed = p.slug === activeSlug
              return (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => applyPalette(p)}
                  className={[
                    'flex items-center gap-3 rounded-sm border bg-card p-2.5 text-left',
                    'transition-[transform,border-color,box-shadow] duration-200 motion-reduce:transition-none',
                    'hover:-translate-y-0.5 hover:shadow-soft motion-reduce:hover:translate-y-0',
                    pressed
                      ? 'border-primary shadow-glow'
                      : 'border-border-subtle',
                  ].join(' ')}
                >
                  <span
                    className="h-9 w-9 flex-none rounded-lg border border-white/10"
                    style={{ background: gradientFor(p) }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">
                      {p.label}
                    </span>
                    <span className="block truncate text-[10px] text-ink-subtle">
                      {p.full}
                    </span>
                  </span>
                  <Check
                    size={16}
                    strokeWidth={2.4}
                    aria-hidden="true"
                    className={[
                      'ml-auto flex-none text-primary',
                      pressed ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                  />
                </button>
              )
            })}
          </div>

          {/* Auto-play */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-border-subtle bg-sunken px-4 py-3.5">
            <div>
              <b className="block text-sm font-semibold text-ink">
                Auto-play demo
              </b>
              <span className="text-[11px] text-ink-subtle">
                {reducedNow
                  ? 'Desactivado: prefers-reduced-motion'
                  : 'Cicla los partidos cada 1.6s'}
              </span>
            </div>
            <Button
              variant={autoplay ? 'primary' : 'secondary'}
              size="sm"
              role="switch"
              aria-checked={autoplay}
              aria-label="Activar auto-play del theming"
              disabled={reducedNow}
              onClick={() => setAutoplay((v) => !v)}
            >
              {autoplay ? (
                <>
                  <Pause size={14} aria-hidden="true" /> Pausar
                </>
              ) : (
                <>
                  <Play size={14} aria-hidden="true" /> Reproducir
                </>
              )}
            </Button>
          </div>

          <p className="mt-3 font-mono text-xs text-ink-subtle">
            {'// '}CSS variables animan via @property (420ms). Charts, botones y
            acentos transicionan juntos.
          </p>
        </div>
      </div>

      {/* Las 8 paletas */}
      <div className="mb-5 mt-10 flex items-center gap-3">
        <span className="font-mono text-xs text-primary">01</span>
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Las 8 paletas
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {PALETTES.map((p) => {
          const pressed = p.slug === activeSlug
          return (
            <button
              key={p.slug}
              type="button"
              aria-pressed={pressed}
              onClick={() => applyPalette(p)}
              className={[
                'overflow-hidden rounded-md border bg-card text-left shadow-soft',
                'transition-[transform,box-shadow] duration-200 motion-reduce:transition-none',
                'hover:-translate-y-0.5 hover:shadow-medium motion-reduce:hover:translate-y-0',
                pressed ? 'border-primary shadow-glow' : 'border-border-subtle',
              ].join(' ')}
            >
              <div
                className="h-16 w-full"
                style={{ background: gradientFor(p) }}
                aria-hidden="true"
              />
              <div className="p-3.5">
                <b className="text-sm font-bold text-ink">{p.label}</b>
                <p className="text-[11px] text-ink-subtle">{p.full}</p>
                <div className="mt-2.5 flex gap-1">
                  {[p.primaryDark, p.primary, p.primaryLight, p.accent].map(
                    (c, i) => (
                      <span
                        key={i}
                        className="h-4 flex-1 rounded"
                        style={{ background: c }}
                        aria-hidden="true"
                      />
                    ),
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-3 font-mono text-xs text-ink-subtle">
        {'// '}Verde / ambar / rojo / azul semanticos se mantienen constantes
        cross-party. Solo el primario y el acento cambian.
      </p>
    </div>
  )
}
