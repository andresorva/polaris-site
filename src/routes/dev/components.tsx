import { useState } from 'react'
import {
  Inbox,
  TriangleAlert,
  TrendingUp,
} from 'lucide-react'
import { ClientSelector } from '../../features/client-theme/ClientSelector'
import { useClientTheme } from '../../features/client-theme/useClientTheme'

// --- UI primitives (components/ui) ---
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'

// --- Data-display (components/data-display) ---
import { KPICard } from '../../components/data-display/KPICard'
import { Sparkline } from '../../components/data-display/Sparkline'

// --- Charts (components/charts) ---
import { SentimentDonut } from '../../components/charts/SentimentDonut'
import { GlobalSentimentBar } from '../../components/charts/GlobalSentimentBar'

// --- States (components/states) ---
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { LoadingState } from '../../components/states/LoadingState'
import { Skeleton } from '../../components/states/Skeleton'
import { DemoBadge } from '../../components/states/DemoBadge'

/**
 * /dev/components - Catalogo del sistema de diseno v3 (mockup 01-design-system).
 *
 * Referencia interna pixel-perfect: tokens v3 (color, tipografia Geist, sombras,
 * radios, sentiment), showcase de primitives (Button / Badge / Card / Input) y
 * de algunos componentes (KPICard, Sparkline, SentimentDonut, GlobalSentimentBar)
 * mas los 4 estados honestos. Toda la data es sintetica -> DemoBadge prominente.
 *
 * Regla 79: cero acentos ni n-con-tilde en strings visibles.
 * No hace fetch a la API: todo render con valores inline.
 */

// ---------------------------------------------------------------------------
// Datos sinteticos (solo para showcase visual, marcado con DemoBadge)
// ---------------------------------------------------------------------------

const sparkUp = [12, 15, 14, 18, 22, 20, 24, 28, 27, 30, 33, 38]
const sparkDown = [40, 38, 36, 35, 30, 28, 24, 22]
const sentimentCounts = {
  positive: 1820,
  negative: 980,
  neutral: 3450,
  mixed: 540,
  sarcastic: 210,
}

// Tokens documentados por categoria. Las muestras leen el var() real -> reflejan
// el tema/partido activo en vivo. Cero color hardcodeado en las swatches.
const NEUTRAL_TOKENS: { name: string; varName: string; note: string }[] = [
  { name: 'bg-base', varName: '--bg-base', note: 'fondo' },
  { name: 'bg-card', varName: '--bg-card', note: 'tarjeta' },
  { name: 'bg-sunken', varName: '--bg-sunken', note: 'input' },
  { name: 'text-primary', varName: '--text-primary', note: 'titulo' },
  { name: 'text-secondary', varName: '--text-secondary', note: 'cuerpo' },
  { name: 'text-tertiary', varName: '--text-tertiary', note: 'label' },
]

const BRAND_TOKENS: { name: string; varName: string; note: string }[] = [
  { name: 'primary', varName: '--polaris-primary', note: 'marca' },
  { name: 'primary-dark', varName: '--polaris-primary-dark', note: 'hover' },
  { name: 'primary-light', varName: '--polaris-primary-light', note: 'tinte' },
  { name: 'accent', varName: '--polaris-accent', note: 'realce' },
]

const SEMANTIC_TOKENS: { name: string; varName: string; hex: string }[] = [
  { name: 'success', varName: '--success', hex: '#2E7D32' },
  { name: 'warning', varName: '--warning', hex: '#F57C00' },
  { name: 'error', varName: '--error', hex: '#D32F2F' },
  { name: 'info', varName: '--info', hex: '#1976D2' },
]

const SENTIMENT_TOKENS: { name: string; varName: string; hex: string }[] = [
  { name: 'positivo', varName: '--sent-positive', hex: '#2E9E5B' },
  { name: 'negativo', varName: '--sent-negative', hex: '#E03B3B' },
  { name: 'neutral', varName: '--sent-neutral', hex: '#8B93A3' },
  { name: 'mixto', varName: '--sent-mixed', hex: '#E0922B' },
  { name: 'sarcastico', varName: '--sent-sarcastic', hex: '#8B5CF6' },
]

const TYPE_SCALE: { meta: string; varName: string; weight: number; sample: string }[] = [
  { meta: '4xl - 800', varName: '--text-2xl', weight: 800, sample: 'Vista General' },
  { meta: '2xl - 700', varName: '--text-xl', weight: 700, sample: 'Carlos Orvananos' },
  { meta: 'lg - 600', varName: '--text-md', weight: 600, sample: 'Senales activas hoy' },
  { meta: 'base - 400', varName: '--text-base', weight: 400, sample: 'Cuerpo legible para briefs.' },
]

const SPACE_SCALE: { token: string; px: number }[] = [
  { token: 'space-1', px: 4 },
  { token: 'space-2', px: 8 },
  { token: 'space-3', px: 12 },
  { token: 'space-4', px: 16 },
  { token: 'space-5', px: 24 },
  { token: 'space-6', px: 32 },
  { token: 'space-7', px: 48 },
  { token: 'space-8', px: 64 },
]

const RADII: { token: string; varName: string; px: string }[] = [
  { token: 'xs', varName: '--radius-xs', px: '6' },
  { token: 'sm', varName: '--radius-sm', px: '10' },
  { token: 'md', varName: '--radius-md', px: '16' },
  { token: 'lg', varName: '--radius-lg', px: '24' },
  { token: 'xl', varName: '--radius-xl', px: '32' },
]

const SHADOWS: { token: string; shadow: string }[] = [
  { token: 'soft', shadow: 'var(--shadow-soft)' },
  { token: 'medium', shadow: 'var(--shadow-medium)' },
  { token: 'strong', shadow: 'var(--shadow-strong)' },
  { token: 'glow', shadow: 'var(--glow-primary)' },
]

// ---------------------------------------------------------------------------
// Helpers de layout
// ---------------------------------------------------------------------------

function Section({
  n,
  title,
  description,
  children,
}: {
  n: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5 scroll-mt-20">
      <header>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-primary">{n}</span>
          <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>
        {description ? (
          <p className="mt-2 font-mono text-xs text-ink-subtle">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
      {children}
    </div>
  )
}

// Swatch de token: lee el var() real -> reactivo a tema/partido.
function TokenSwatch({
  name,
  varName,
  note,
}: {
  name: string
  varName: string
  note: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xs bg-sunken px-2.5 py-2">
      <span
        className="h-[30px] w-[30px] shrink-0 rounded-lg border border-border-subtle"
        style={{ background: `var(${varName})` }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <b className="truncate text-xs font-semibold text-ink">{name}</b>
        <span className="font-mono text-[10px] text-ink-subtle">{note}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export function DevComponentsPage() {
  const { client, mode, resolvedTheme, setMode } = useClientTheme()
  const [retryCount, setRetryCount] = useState(0)

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-base/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm tracking-tight text-ink">
              POLARIS - Sistema de diseno
            </div>
            <DemoBadge always />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="mr-1 text-ink-subtle">Tema:</span>
              {(['light', 'dark', 'system'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={
                    'rounded-md border px-2 py-1 font-mono text-xs transition-colors ' +
                    (mode === m
                      ? 'border-primary bg-primary text-[color:var(--text-on-primary)]'
                      : 'border-border-subtle bg-card text-ink hover:bg-[var(--bg-hover)]')
                  }
                >
                  {m}
                </button>
              ))}
            </div>
            <ClientSelector />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-6 pb-2 font-mono text-[11px] text-ink-subtle">
          <span>client: {client.id}</span>
          <span>party: {client.party}</span>
          <span>
            theme: {resolvedTheme} (mode {mode})
          </span>
          <span>primary: {client.primary}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
        <div className="space-y-3">
          <Eyebrow>Foundation - v3</Eyebrow>
          <h1 className="text-3xl font-extrabold tracking-tighter text-ink">
            Sistema de diseno
          </h1>
          <p className="max-w-[52ch] text-sm text-ink-muted">
            La fuente de verdad visual de POLARIS. Tokens, theming multi-tenant,
            tipografia Geist y primitives. Todo render con data sintetica - cero
            fetch a la API. Cambia el cliente y el tema para validar el theming.
          </p>
        </div>

        {/* 01 - Theming + neutrales */}
        <Section
          n="01"
          title="Color y theming multi-tenant"
          description="// La app se auto-tinta segun el partido del cliente activo. Las swatches leen el var() real -> reflejan el tema/partido en vivo. Verde/ambar/rojo/azul semanticos se mantienen constantes cross-party."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <Eyebrow>Marca - partido activo</Eyebrow>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BRAND_TOKENS.map((t) => (
                  <TokenSwatch key={t.varName} {...t} />
                ))}
              </div>
            </Card>
            <Card>
              <Eyebrow>Neutrales - tema activo</Eyebrow>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {NEUTRAL_TOKENS.map((t) => (
                  <TokenSwatch key={t.varName} {...t} />
                ))}
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <Eyebrow>Semanticos - constantes cross-party</Eyebrow>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SEMANTIC_TOKENS.map((t) => (
                  <TokenSwatch key={t.varName} name={t.name} varName={t.varName} note={t.hex} />
                ))}
              </div>
            </Card>
            <Card>
              <Eyebrow>Sentiment - paleta de analisis</Eyebrow>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SENTIMENT_TOKENS.map((t) => (
                  <TokenSwatch key={t.varName} name={t.name} varName={t.varName} note={t.hex} />
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* 02 - Tipografia */}
        <Section
          n="02"
          title="Tipografia"
          description="// Geist Variable para UI (letterforms geometricas, legibles a densidad de datos). IBM Plex Mono con tabular-nums para numeros, scores, deltas y timestamps."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <Eyebrow>Escala UI - Geist Variable</Eyebrow>
              <div className="mt-2">
                {TYPE_SCALE.map((t, i) => (
                  <div
                    key={t.varName}
                    className={
                      'flex items-baseline gap-5 py-4 ' +
                      (i < TYPE_SCALE.length - 1 ? 'border-b border-border-subtle' : '')
                    }
                  >
                    <span className="w-28 shrink-0 font-mono text-xs text-ink-subtle">
                      {t.meta}
                    </span>
                    <span
                      className="text-ink"
                      style={{
                        fontSize: `var(${t.varName})`,
                        fontWeight: t.weight,
                        letterSpacing: 'var(--tracking-tight)',
                      }}
                    >
                      {t.sample}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Eyebrow>Datos - IBM Plex Mono - tabular</Eyebrow>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-baseline gap-5">
                  <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
                    62.38
                  </span>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-ink-muted">
                    44.7%
                  </span>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-ink-muted">
                    99,637
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="positive">+3.2%</Badge>
                  <Badge variant="negative">-0.87</Badge>
                  <Badge variant="mixed">z=0.95</Badge>
                  <Badge variant="accent">1,333</Badge>
                </div>
                <p className="font-mono text-xs text-ink-subtle">
                  // tabular-nums alinea verticalmente columnas densas de tablas.
                </p>
              </div>
            </Card>
          </div>
        </Section>

        {/* 03 - Espaciado, radios, sombras */}
        <Section
          n="03"
          title="Espaciado, radios y sombras"
          description="// Escala de espaciado base 4. Radios xs..xl. Sombras en capas tintadas del tema."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <Eyebrow>Espaciado - base 4</Eyebrow>
              <div className="mt-4 space-y-2">
                {SPACE_SCALE.map((s) => (
                  <div key={s.token} className="flex items-center gap-4">
                    <span className="w-24 font-mono text-xs text-ink-subtle">
                      {s.px}px - {s.token}
                    </span>
                    <span
                      className="h-3.5 rounded-[3px] bg-primary"
                      style={{ width: s.px }}
                    />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Eyebrow>Radios</Eyebrow>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {RADII.map((r) => (
                  <div key={r.token} className="flex flex-col items-center gap-2">
                    <span
                      className="h-16 w-16 border-[1.5px] border-primary"
                      style={{
                        borderRadius: `var(${r.varName})`,
                        background: 'var(--primary-soft)',
                      }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[11px] text-ink-subtle">
                      {r.px} - {r.token}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Eyebrow>Sombras en capas</Eyebrow>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {SHADOWS.map((s) => (
                  <div
                    key={s.token}
                    className="grid aspect-[3/2] place-items-center rounded-md bg-card font-mono text-xs text-ink-muted"
                    style={{ boxShadow: s.shadow }}
                  >
                    {s.token}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* 04 - Primitives */}
        <Section
          n="04"
          title="Primitives"
          description="// Button, Badge, Card, Input - los atomos documentados de components/ui."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-4">
              <Eyebrow>Button - variantes y tamanos</Eyebrow>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Entrar</Button>
                <Button variant="secondary">Cancelar</Button>
                <Button variant="ghost">Ver detalle</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="primary" loading>
                  Cargando
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <Eyebrow>Input</Eyebrow>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Usuario</span>
                <Input placeholder="andresorva" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Password</span>
                <Input type="password" defaultValue="PolarisTest" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-sentiment-negative">Error</span>
                <Input invalid defaultValue="credencial-invalida" />
                <span className="text-xs text-sentiment-negative">
                  Credenciales no validas
                </span>
              </label>
            </Card>

            <Card className="flex flex-col gap-4">
              <Eyebrow>Badge - sentiment y severidad</Eyebrow>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>default</Badge>
                <Badge variant="positive">positivo</Badge>
                <Badge variant="neutral">neutral</Badge>
                <Badge variant="negative">negativo</Badge>
                <Badge variant="mixed">mixto</Badge>
                <Badge variant="sarcastic">sarcastico</Badge>
                <Badge variant="unknown">unknown</Badge>
                <Badge variant="accent">accent</Badge>
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <Eyebrow>Card</Eyebrow>
              <p className="text-sm text-ink-muted">
                Superficie base con borde sutil, radio md y sombra soft. Todos
                los paneles se construyen sobre Card.
              </p>
              <Card className="bg-sunken">
                <span className="text-xs text-ink-subtle">Card anidada</span>
              </Card>
            </Card>
          </div>
        </Section>

        {/* 05 - Componentes */}
        <Section
          n="05"
          title="Componentes"
          description="// KPICard + Sparkline (mockup 04), SentimentDonut + GlobalSentimentBar (mockup 06). Todos presentacionales: la pantalla provee data y estados."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Menciones 24h"
              value={4280}
              delta={{ value: 12.4, period: 'vs ayer' }}
              sparkline={sparkUp}
            />
            <KPICard
              label="Engagement 24h"
              value={32145}
              delta={{ value: -4.2, period: 'vs ayer' }}
              sparkline={sparkDown}
            />
            <KPICard
              label="PPI - indice"
              value={62.38}
              format="score"
              delta={{ value: 3.2, period: '30d' }}
              note="Maximo de la semana"
              sparkline={sparkUp}
            />
            <KPICard label="Cargando" value={0} loading />
          </div>

          <Card className="flex flex-col gap-3">
            <Eyebrow>Sparkline - tonos</Eyebrow>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <span className="font-mono text-[11px] text-ink-subtle">primary</span>
                <Sparkline data={sparkUp} tone="primary" fill />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[11px] text-ink-subtle">positive</span>
                <Sparkline data={sparkUp} tone="positive" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[11px] text-ink-subtle">negative</span>
                <Sparkline data={sparkDown} tone="negative" />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SentimentDonut counts={sentimentCounts} centerLabel="menciones" />
            <GlobalSentimentBar counts={sentimentCounts} hint="30d" />
          </div>

          {/* Alert banner replica (inline, sin fetch) */}
          <div
            className="flex items-start gap-4 rounded-md border p-4"
            style={{
              background: 'var(--warning-soft)',
              borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)',
            }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
              style={{
                background: 'color-mix(in srgb, var(--warning) 22%, transparent)',
                color: 'var(--warning)',
              }}
              aria-hidden="true"
            >
              <TriangleAlert size={18} strokeWidth={2.2} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <b className="text-sm font-semibold text-ink">
                  2 alertas activas - warning
                </b>
                <Badge variant="mixed">z=0.95</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Pico de volumen tras lluvias atipicas en Cuajimalpa. Criticas
                por falta de mantenimiento.
              </p>
            </div>
          </div>
        </Section>

        {/* 06 - Los 4 estados */}
        <Section
          n="06"
          title="Los 4 estados de cada componente"
          description="// Loading usa shimmer tintado del partido (no spinner). Empty es honesto con CTA. Error reintenta. Cero datos falsos sin flag."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padded={false}>
              <div className="p-4">
                <span className="font-mono text-[11px] text-ink-subtle">// loading</span>
                <div className="mt-4 flex flex-col gap-3">
                  <Skeleton height="14px" width="40%" />
                  <Skeleton height="28px" width="70%" />
                  <Skeleton height="32px" width="100%" />
                </div>
              </div>
            </Card>
            <Card padded={false}>
              <span className="block px-4 pt-4 font-mono text-[11px] text-ink-subtle">
                // empty
              </span>
              <EmptyState
                title="Sin menciones aun"
                description="No hay datos para este rango."
                icon={<Inbox size={40} strokeWidth={1.5} />}
                cta={{ label: 'Ampliar rango', onClick: () => {} }}
              />
            </Card>
            <Card padded={false}>
              <span className="block px-4 pt-4 font-mono text-[11px] text-ink-subtle">
                // error
              </span>
              <ErrorState
                description={`No se pudieron cargar los datos. Reintenta. Reintentos: ${retryCount}`}
                onRetry={() => setRetryCount((c) => c + 1)}
              />
            </Card>
            <KPICard
              label="Menciones"
              value={1333}
              delta={{ value: 8, period: 'vs ayer' }}
              sparkline={sparkUp}
            />
          </div>

          <Card className="flex flex-col gap-4">
            <Eyebrow>LoadingState - variantes</Eyebrow>
            <LoadingState variant="kpi" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LoadingState variant="chart" />
              <LoadingState variant="table" />
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <DemoBadge always />
            <span className="text-sm text-ink-muted">
              Chip prominente para paneles con data sintetica / placeholder.
              Removible desde un solo lugar (VITE_DEMO_BADGE o Settings).
            </span>
            <TrendingUp size={16} className="ml-auto text-ink-subtle" aria-hidden="true" />
          </Card>
        </Section>
      </main>

      <footer className="mx-auto mt-12 max-w-6xl border-t border-border-subtle px-6 py-8 font-mono text-xs text-ink-subtle">
        Design system v3 - mockup 01-design-system - referencia interna
      </footer>
    </div>
  )
}

export default DevComponentsPage
