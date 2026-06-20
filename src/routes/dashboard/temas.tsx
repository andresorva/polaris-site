import { useMemo, useState } from 'react'
import { Layers, Sparkles, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/states/EmptyState'
import { ErrorState } from '../../components/states/ErrorState'
import { SkeletonText } from '../../components/states/Skeleton'
import {
  TaxonomySunburst,
  CATEGORY_LABELS,
  SUB_LABELS,
  TAXONOMY,
  type CategoryKey,
} from '../../components/charts/TaxonomySunburst'
import { useTopicsGrouped } from '../../lib/api/queries'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import type { TopicGroupRow } from '../../lib/api/extended-types'
import { formatPct } from '../../lib/utils/format'

// ---------------------------------------------------------------------------
// Temas y narrativas (mockup 07)
//
// Diferenciador estrella: TaxonomySunburst (2 anillos) alimentado de verdad por
// useTopicsGrouped(grouped=true -> rows {categoria, sub, count, pct_neg}). A su
// lado, lista de sub-temas con % negativo. Abajo, tarjetas por categoria top.
//
// La taxonomia canonica (7 top / 36 sub) + sus colores y labels SIN acentos se
// reusan tal cual del componente TaxonomySunburst (single source of truth);
// aqui solo agregamos los rows del backend para la lista lateral y las cards.
//
// Regla 79: cero acentos ni n-con-tilde en strings visibles.
// ---------------------------------------------------------------------------

// Color base por categoria (mirror del TAXONOMY del componente sunburst).
const CATEGORY_COLOR: Record<CategoryKey, string> = TAXONOMY.reduce(
  (acc, c) => {
    acc[c.key] = c.color
    return acc
  },
  {} as Record<CategoryKey, string>,
)

const SUB_TO_CATEGORY: Record<string, CategoryKey> = TAXONOMY.reduce(
  (acc, c) => {
    for (const s of c.subs) acc[s] = c.key
    return acc
  },
  {} as Record<string, CategoryKey>,
)

const CATEGORY_KEY_SET = new Set<string>(TAXONOMY.map((c) => c.key))

// Marcas diacriticas combinantes (U+0300..U+036F): se quitan al normalizar.
// Se declara por code points para no escribir caracteres acentuados en fuente.
const COMBINING_MARKS = /[\u0300-\u036f]/g

function normKey(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[\s/.-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function resolveCategory(raw: string | null | undefined): CategoryKey | null {
  const n = normKey(raw).toUpperCase()
  return CATEGORY_KEY_SET.has(n) ? (n as CategoryKey) : null
}

// ---------------------------------------------------------------------------
// Derivacion: rows backend -> sub-temas y categorias agregadas (% neg ponderado)
// ---------------------------------------------------------------------------

interface SubItem {
  catKey: CategoryKey
  catLabel: string
  color: string
  subKey: string
  subLabel: string
  count: number
  pctNeg: number
}

interface CatItem {
  key: CategoryKey
  label: string
  color: string
  count: number
  pctNeg: number
  subCount: number
}

interface Derived {
  subs: SubItem[]
  cats: CatItem[]
  grand: number
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0
  return n < 0 ? 0 : n > 100 ? 100 : n
}

function deriveModel(rows: TopicGroupRow[] | undefined): Derived {
  type Agg = { count: number; negWeighted: number }
  const subAgg = new Map<string, Agg>() // `${cat}::${sub}`
  const catAgg = new Map<CategoryKey, Agg>()
  let grand = 0

  for (const row of rows ?? []) {
    const cat = resolveCategory(row.categoria)
    if (!cat) continue
    const count = Number.isFinite(row.count) ? Math.max(0, row.count) : 0
    if (count <= 0) continue
    const pctNeg = clampPct(row.pct_neg)
    grand += count

    const ca = catAgg.get(cat) ?? { count: 0, negWeighted: 0 }
    ca.count += count
    ca.negWeighted += pctNeg * count
    catAgg.set(cat, ca)

    const subKey = normKey(row.sub)
    if (subKey.length > 0 && SUB_TO_CATEGORY[subKey] === cat) {
      const sk = `${cat}::${subKey}`
      const sa = subAgg.get(sk) ?? { count: 0, negWeighted: 0 }
      sa.count += count
      sa.negWeighted += pctNeg * count
      subAgg.set(sk, sa)
    }
  }

  const subs: SubItem[] = []
  for (const [sk, agg] of subAgg) {
    const [catRaw, subKey] = sk.split('::')
    const catKey = catRaw as CategoryKey
    subs.push({
      catKey,
      catLabel: CATEGORY_LABELS[catKey],
      color: CATEGORY_COLOR[catKey],
      subKey,
      subLabel: SUB_LABELS[subKey] ?? subKey,
      count: agg.count,
      pctNeg: agg.count > 0 ? agg.negWeighted / agg.count : 0,
    })
  }
  subs.sort((a, b) => b.count - a.count)

  // Categorias en el orden canonico de TAXONOMY, solo las que tienen data.
  const cats: CatItem[] = TAXONOMY.map((def) => {
    const agg = catAgg.get(def.key)
    const count = agg?.count ?? 0
    const subCount = subs.filter((s) => s.catKey === def.key).length
    return {
      key: def.key,
      label: def.label,
      color: def.color,
      count,
      pctNeg: count > 0 ? (agg as Agg).negWeighted / count : 0,
      subCount,
    }
  }).filter((c) => c.count > 0)
  cats.sort((a, b) => b.count - a.count)

  return { subs, cats, grand }
}

// ---------------------------------------------------------------------------
// % neg pill (color por intensidad de negatividad)
// ---------------------------------------------------------------------------

function negVariant(pctNeg: number): 'negative' | 'mixed' | 'neutral' {
  if (pctNeg >= 60) return 'negative'
  if (pctNeg >= 35) return 'mixed'
  return 'neutral'
}

function NegPill({ pctNeg }: { pctNeg: number }) {
  return (
    <Badge variant={negVariant(pctNeg)}>
      {formatPct(pctNeg, 0)} neg
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Lista lateral de sub-temas (diferenciador): sub + categoria + count + %neg
// ---------------------------------------------------------------------------

function SubTopicsList({
  subs,
  highlight,
  onHover,
}: {
  subs: SubItem[]
  highlight: string | null
  onHover: (subKey: string | null) => void
}) {
  return (
    <ul className="flex flex-col gap-1" aria-label="Sub-temas por menciones">
      {subs.map((s) => {
        const active = highlight === s.subKey
        const max = subs[0]?.count ?? 1
        const widthPct = max > 0 ? Math.max(4, (s.count / max) * 100) : 0
        return (
          <li key={`${s.catKey}-${s.subKey}`}>
            <button
              type="button"
              className={[
                'flex w-full flex-col gap-1 rounded-md px-2 py-1.5 text-left transition-colors',
                active ? 'bg-sunken' : 'hover:bg-sunken',
              ].join(' ')}
              onMouseEnter={() => onHover(s.subKey)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(s.subKey)}
              onBlur={() => onHover(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 flex-none rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1 truncate text-sm text-ink">
                  {s.subLabel}
                </span>
                <span className="font-mono text-xs tabular-nums text-ink-muted">
                  {s.count}
                </span>
                <NegPill pctNeg={s.pctNeg} />
              </div>
              <div className="flex items-center gap-2 pl-[18px]">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wide text-ink-subtle">
                  {s.catLabel}
                </span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Tarjeta por categoria top (anillo de color + count + %neg + subs reales)
// ---------------------------------------------------------------------------

function CategoryCard({ cat, subs }: { cat: CatItem; subs: SubItem[] }) {
  const mine = subs.filter((s) => s.catKey === cat.key)
  return (
    <Card
      className="border-t-[3px]"
      style={{ borderTopColor: cat.color }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <b className="text-sm font-bold tracking-tight text-ink">
          {cat.label}
        </b>
        <NegPill pctNeg={cat.pctNeg} />
      </div>
      <div className="font-mono text-xs text-ink-muted mb-3">
        <b className="text-ink">{cat.count}</b> menciones · {cat.subCount}{' '}
        sub-categorias
      </div>
      <div className="flex flex-wrap gap-1.5">
        {mine.map((s) => (
          <span
            key={s.subKey}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-sunken px-2.5 py-0.5 text-xs text-ink-muted"
          >
            {s.subLabel}{' '}
            <b className="font-mono text-ink">{s.count}</b>
          </span>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Temas y narrativas route
// ---------------------------------------------------------------------------

export function Temas() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  // Ventana 90d: subtemas locales de baja frecuencia necesitan rango amplio.
  const topicsQ = useTopicsGrouped(politicianId, { days: 90 })
  const rows = topicsQ.data?.rows

  const model = useMemo(() => deriveModel(rows), [rows])
  const [hoverSub, setHoverSub] = useState<string | null>(null)

  const hasData = model.grand > 0 && model.cats.length > 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Temas y narrativas"
        subtitle="7 grandes temas y mas de 30 asuntos locales. Donde otros solo ven politica, POLARIS distingue un bache de una falla de alumbrado."
      />

      {/* Fila superior: sunburst + lista de sub-temas (diferenciador) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mapa de temas (sunburst de 2 anillos, wired) */}
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-ink-muted" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Mapa de temas</h2>
            </div>
            <span className="text-xs text-ink-subtle">
              pasa el cursor por los anillos
            </span>
          </div>
          <TaxonomySunburst
            data={rows}
            isLoading={topicsQ.isLoading}
            isError={topicsQ.isError}
            onRetry={() => topicsQ.refetch()}
          />
        </Card>

        {/* Sub-temas por volumen + % negativo */}
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={16}
                className="text-ink-muted"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-ink">
                Sub-temas por volumen
              </h2>
            </div>
            <span className="text-xs text-ink-subtle">ventana 90d</span>
          </div>

          {topicsQ.isLoading ? (
            <SkeletonText lines={8} />
          ) : topicsQ.isError ? (
            <ErrorState
              title="No se pudieron cargar los sub-temas"
              description="Hubo un problema al obtener la taxonomia de temas. Intenta de nuevo."
              onRetry={() => topicsQ.refetch()}
            />
          ) : model.subs.length === 0 ? (
            <EmptyState
              icon={<TrendingUp size={48} strokeWidth={1.5} />}
              title="Sin sub-temas en el periodo"
              description="No hay menciones organizadas por tema en los ultimos 90 dias."
            />
          ) : (
            <SubTopicsList
              subs={model.subs}
              highlight={hoverSub}
              onHover={setHoverSub}
            />
          )}
        </Card>
      </div>

      {/* Tarjetas por categoria top (data real agregada) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-ink">Categorias top</h2>
          {hasData ? (
            <span className="font-mono text-xs text-ink-muted">
              {model.cats.length} categorias · {model.subs.length} sub-temas ·{' '}
              {model.grand} menciones
            </span>
          ) : null}
        </div>

        {topicsQ.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <SkeletonText lines={4} />
              </Card>
            ))}
          </div>
        ) : topicsQ.isError ? (
          <Card>
            <ErrorState
              title="No se pudieron cargar las categorias"
              description="Hubo un problema al obtener la taxonomia de temas. Intenta de nuevo."
              onRetry={() => topicsQ.refetch()}
            />
          </Card>
        ) : model.cats.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Layers size={48} strokeWidth={1.5} />}
              title="Sin categorias en este periodo"
              description="Aun no hay menciones organizadas por tema en este periodo. Los conteos apareceran conforme se detecte contenido nuevo."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {model.cats.map((cat) => (
              <CategoryCard key={cat.key} cat={cat} subs={model.subs} />
            ))}
          </div>
        )}
      </section>

      {/* Vocabulario emergente — sin endpoint en backend actual */}
      <Card>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-ink-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">
              Vocabulario emergente
            </h2>
          </div>
          <span className="text-xs text-ink-subtle">palabras nuevas 7d</span>
        </div>
        {/* API PENDIENTE: deteccion de terminos emergentes (n-gram drift) no
            tiene endpoint expuesto en el backend actual. Empty-state honesto
            en vez de data sintetica (anti F-9 / F-11). */}
        <EmptyState
          icon={<Sparkles size={48} strokeWidth={1.5} />}
          title="Proximamente"
          description="Pronto podras ver las palabras nuevas que empiezan a sonar alrededor de ti. Esta seccion se habilitara mas adelante."
        />
      </Card>
    </div>
  )
}

export default Temas
