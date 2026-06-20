import { useMemo, useState } from 'react'
import type { TopicGroupRow } from '../../lib/api/extended-types'
import { cn } from '../../lib/utils/cn'
import { SkeletonChart } from '../states/LoadingSkeleton'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'

/**
 * TaxonomySunburst - sunburst SVG de 2 anillos para la taxonomia politica MX.
 *
 *   anillo interno = 7 categorias top
 *   anillo externo = 36 sub-categorias
 *
 * Color por categoria, intensidad (oscurecido hacia un rojo de negatividad)
 * segun pct_neg. Arcos via path d= con math propia (sin dependencias).
 *
 * Input: TopicGroupRow[] = [{ categoria, sub, count, pct_neg, in_taxonomy }].
 * El componente colapsa filas por (categoria, sub) y mapea sub -> categoria
 * canonica usando la TAXONOMIA exacta; filas fuera de la taxonomia se ignoran
 * para el dibujo de anillos (se reportan via prop opcional, ver onUnknown).
 *
 * Regla 79: cero acentos ni n-con-tilde en strings visibles.
 */

// ----------------------------------------------------------------------------
// Taxonomia canonica (7 top / 36 sub). Las claves de sub estan en snake_case
// tal como las emite el backend; el label visible es legible y SIN acentos.
// ----------------------------------------------------------------------------

type CategoryKey =
  | 'INFRAESTRUCTURA'
  | 'MOVILIDAD'
  | 'SEGURIDAD'
  | 'MEDIO_AMBIENTE'
  | 'SERVICIOS_PUBLICOS'
  | 'GOBIERNO'
  | 'CRITICA_POLITICA'

interface CategoryDef {
  key: CategoryKey
  /** Label visible, sin acentos. */
  label: string
  /** Color base de la categoria (hex). */
  color: string
  /** subs canonicas en orden, snake_case. */
  subs: string[]
}

const TAXONOMY: CategoryDef[] = [
  {
    key: 'INFRAESTRUCTURA',
    label: 'Infraestructura',
    color: '#3B6FE0',
    subs: [
      'obras_inconclusas',
      'baches',
      'pavimentacion',
      'banquetas',
      'alumbrado',
      'drenaje',
      'agua_potable',
    ],
  },
  {
    key: 'MOVILIDAD',
    label: 'Movilidad',
    color: '#2E9E5B',
    subs: [
      'vialidad_general',
      'trafico',
      'transporte_publico',
      'estacionamiento',
      'accidentes_viales',
    ],
  },
  {
    key: 'SEGURIDAD',
    label: 'Seguridad',
    color: '#E0922B',
    subs: [
      'delincuencia',
      'violencia_de_genero',
      'secuestros',
      'robos',
      'c5_cdmx_reportes',
    ],
  },
  {
    key: 'MEDIO_AMBIENTE',
    label: 'Medio Ambiente',
    color: '#1FA39A',
    subs: [
      'tala_arboles',
      'barrancas',
      'contaminacion',
      'proteccion_animal',
      'lluvias_deslaves',
    ],
  },
  {
    key: 'SERVICIOS_PUBLICOS',
    label: 'Servicios Publicos',
    color: '#8B5CF6',
    subs: [
      'basura_recoleccion',
      'mercados',
      'parques',
      'panteones',
      'tianguis',
    ],
  },
  {
    key: 'GOBIERNO',
    label: 'Gobierno',
    color: '#6B7B8F',
    subs: ['actos_publicos', 'eventos', 'declaraciones', 'reuniones', 'giras'],
  },
  {
    key: 'CRITICA_POLITICA',
    label: 'Critica Politica',
    color: '#E03B3B',
    subs: [
      'corrupcion',
      'ataques_personales',
      'cuestionamientos_gestion',
      'comparaciones_otros_politicos',
    ],
  },
]

/** Labels legibles SIN acentos para sub-categorias snake_case. */
const SUB_LABELS: Record<string, string> = {
  obras_inconclusas: 'Obras inconclusas',
  baches: 'Baches',
  pavimentacion: 'Pavimentacion',
  banquetas: 'Banquetas',
  alumbrado: 'Alumbrado',
  drenaje: 'Drenaje',
  agua_potable: 'Agua potable',
  vialidad_general: 'Vialidad general',
  trafico: 'Trafico',
  transporte_publico: 'Transporte publico',
  estacionamiento: 'Estacionamiento',
  accidentes_viales: 'Accidentes viales',
  delincuencia: 'Delincuencia',
  violencia_de_genero: 'Violencia de genero',
  secuestros: 'Secuestros',
  robos: 'Robos',
  c5_cdmx_reportes: 'C5 CDMX reportes',
  tala_arboles: 'Tala de arboles',
  barrancas: 'Barrancas',
  contaminacion: 'Contaminacion',
  proteccion_animal: 'Proteccion animal',
  lluvias_deslaves: 'Lluvias y deslaves',
  basura_recoleccion: 'Basura y recoleccion',
  mercados: 'Mercados',
  parques: 'Parques',
  panteones: 'Panteones',
  tianguis: 'Tianguis',
  actos_publicos: 'Actos publicos',
  eventos: 'Eventos',
  declaraciones: 'Declaraciones',
  reuniones: 'Reuniones',
  giras: 'Giras',
  corrupcion: 'Corrupcion',
  ataques_personales: 'Ataques personales',
  cuestionamientos_gestion: 'Cuestionamientos de gestion',
  comparaciones_otros_politicos: 'Comparaciones con otros politicos',
}

const CATEGORY_LABELS: Record<CategoryKey, string> = TAXONOMY.reduce(
  (acc, c) => {
    acc[c.key] = c.label
    return acc
  },
  {} as Record<CategoryKey, string>,
)

/** Mapa sub-canonica -> categoria. Construido una sola vez. */
const SUB_TO_CATEGORY: Record<string, CategoryKey> = TAXONOMY.reduce(
  (acc, c) => {
    for (const s of c.subs) acc[s] = c.key
    return acc
  },
  {} as Record<string, CategoryKey>,
)

// ----------------------------------------------------------------------------
// Normalizacion del input (defensiva): el backend puede mandar variantes de
// caja, acentos o categoria duplicada. Reducimos a la clave canonica.
// ----------------------------------------------------------------------------

// Rango Unicode de marcas diacriticas combinantes (U+0300..U+036F). Se declara
// por code points para no escribir caracteres acentuados en el fuente.
const COMBINING_MARKS = /[\u0300-\u036f]/g

/** Quita acentos y normaliza a snake_case en minusculas. */
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

const CATEGORY_KEY_SET = new Set<string>(TAXONOMY.map((c) => c.key))

function resolveCategory(raw: string | null | undefined): CategoryKey | null {
  const n = normKey(raw).toUpperCase()
  if (CATEGORY_KEY_SET.has(n)) return n as CategoryKey
  return null
}

// ----------------------------------------------------------------------------
// Geometria de arcos. Angulos en grados, 0 = arriba (-90 en math estandar).
// ----------------------------------------------------------------------------

const CX = 160
const CY = 160
const R0 = 46 // radio interno del anillo de categorias
const R1 = 96 // radio externo categorias / arranque subs
const R2 = 142 // radio externo subs
const GAP = 2 // separacion radial entre anillos (px)
const VIEWBOX = 320

function deg2rad(a: number): number {
  return ((a - 90) * Math.PI) / 180
}

function polar(r: number, a: number): [number, number] {
  return [CX + r * Math.cos(deg2rad(a)), CY + r * Math.sin(deg2rad(a))]
}

/** Path de un sector anular entre radios ri..ro y angulos a0..a1 (grados). */
function arcPath(ri: number, ro: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0
  const [x0, y0] = polar(ro, a0)
  const [x1, y1] = polar(ro, a1)
  const [x2, y2] = polar(ri, a1)
  const [x3, y3] = polar(ri, a0)
  return (
    `M${x0.toFixed(2)},${y0.toFixed(2)} ` +
    `A${ro},${ro} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} ` +
    `L${x2.toFixed(2)},${y2.toFixed(2)} ` +
    `A${ri},${ri} 0 ${large} 0 ${x3.toFixed(2)},${y3.toFixed(2)} Z`
  )
}

// ----------------------------------------------------------------------------
// Color: tinte de la categoria modulado por intensidad de negatividad.
// pct_neg 0 -> tono claro (lighten hacia blanco); pct_neg 100 -> tono oscuro
// (mezcla con rojo de negatividad). Devuelve rgb().
// ----------------------------------------------------------------------------

const NEG_RGB: [number, number, number] = [224, 59, 59] // #E03B3B

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

/**
 * Color final de un arco.
 * @param baseHex color de la categoria
 * @param pctNeg 0..100
 * @param outer si es el anillo externo (sub) lo aclaramos un poco para separar
 */
function arcFill(baseHex: string, pctNeg: number, outer: boolean): string {
  const base = hexToRgb(baseHex)
  const t = clamp01(pctNeg / 100)
  // Baja negatividad -> aclara hacia blanco (hasta +35%).
  // Alta negatividad -> mezcla hacia el rojo de negatividad (hasta 55%).
  let rgb: [number, number, number]
  if (t <= 0.5) {
    const lighten = (0.5 - t) / 0.5 // 1 en 0%, 0 en 50%
    rgb = mix(base, [255, 255, 255], lighten * 0.35)
  } else {
    const toNeg = (t - 0.5) / 0.5 // 0 en 50%, 1 en 100%
    rgb = mix(base, NEG_RGB, toNeg * 0.55)
  }
  if (outer) {
    // El anillo externo es un poco mas claro para separarlo visualmente.
    rgb = mix(rgb, [255, 255, 255], 0.18)
  }
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

// ----------------------------------------------------------------------------
// Modelo derivado para el dibujo.
// ----------------------------------------------------------------------------

interface SubSlice {
  key: string
  label: string
  count: number
  pctNeg: number
  a0: number
  a1: number
  path: string
  fill: string
}

interface CatSlice {
  key: CategoryKey
  label: string
  color: string
  count: number
  pctNeg: number
  a0: number
  a1: number
  path: string
  fill: string
  subs: SubSlice[]
}

interface SunModel {
  cats: CatSlice[]
  grand: number
  /** ponderado por count. */
  grandPctNeg: number
}

/** Tooltip / centro activo. */
interface FocusInfo {
  label: string
  count: number
  pctNeg: number
}

function buildModel(rows: TopicGroupRow[]): SunModel {
  // Agregamos counts y suma ponderada de pct_neg por (cat, sub).
  type Agg = { count: number; negWeighted: number }
  const catAgg = new Map<CategoryKey, Agg>()
  const subAgg = new Map<string, Agg>() // key = `${cat}::${sub}`

  for (const row of rows) {
    const cat = resolveCategory(row.categoria)
    if (!cat) continue
    const count = Number.isFinite(row.count) ? Math.max(0, row.count) : 0
    if (count <= 0) continue
    const pctNeg = Number.isFinite(row.pct_neg)
      ? clamp01(row.pct_neg / 100) * 100
      : 0

    const ca = catAgg.get(cat) ?? { count: 0, negWeighted: 0 }
    ca.count += count
    ca.negWeighted += pctNeg * count
    catAgg.set(cat, ca)

    const subKey = normKey(row.sub)
    // Solo dibujamos subs canonicas de la categoria; el backend ya entrega
    // snake_case. Si la sub no pertenece a la categoria, la sumamos a la
    // categoria pero no creamos arco externo huerfano.
    const belongs =
      subKey.length > 0 && SUB_TO_CATEGORY[subKey] === cat
    if (belongs) {
      const sk = `${cat}::${subKey}`
      const sa = subAgg.get(sk) ?? { count: 0, negWeighted: 0 }
      sa.count += count
      sa.negWeighted += pctNeg * count
      subAgg.set(sk, sa)
    }
  }

  // Orden estable: por el orden de TAXONOMY; subs por count desc.
  let grand = 0
  let grandNegWeighted = 0
  const catsRaw = TAXONOMY.map((def) => {
    const agg = catAgg.get(def.key)
    const count = agg?.count ?? 0
    const pctNeg = count > 0 ? (agg as Agg).negWeighted / count : 0
    grand += count
    grandNegWeighted += pctNeg * count

    const subs = def.subs
      .map((sk) => {
        const sa = subAgg.get(`${def.key}::${sk}`)
        const sc = sa?.count ?? 0
        const sNeg = sc > 0 ? (sa as Agg).negWeighted / sc : 0
        return {
          key: sk,
          label: SUB_LABELS[sk] ?? sk,
          count: sc,
          pctNeg: sNeg,
        }
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)

    return { def, count, pctNeg, subs }
  }).filter((c) => c.count > 0)

  // Reparto angular proporcional al count de cada categoria.
  let ang = 0
  const cats: CatSlice[] = catsRaw.map((c) => {
    const span = grand > 0 ? (c.count / grand) * 360 : 0
    const a0 = ang
    const a1 = ang + span
    ang = a1

    // Subs dentro del span de su categoria, proporcional a su count.
    const subTotal = c.subs.reduce((s, x) => s + x.count, 0)
    let sa = a0
    const subSlices: SubSlice[] = c.subs.map((s) => {
      const sSpan = subTotal > 0 ? (s.count / subTotal) * span : 0
      const sa0 = sa
      const sa1 = sa + sSpan
      sa = sa1
      return {
        key: s.key,
        label: s.label,
        count: s.count,
        pctNeg: s.pctNeg,
        a0: sa0,
        a1: sa1,
        path: arcPath(R1 + GAP, R2, sa0, sa1),
        fill: arcFill(c.def.color, s.pctNeg, true),
      }
    })

    return {
      key: c.def.key,
      label: c.def.label,
      color: c.def.color,
      count: c.count,
      pctNeg: c.pctNeg,
      a0,
      a1,
      path: arcPath(R0, R1, a0, a1),
      fill: arcFill(c.def.color, c.pctNeg, false),
      subs: subSlices,
    }
  })

  return {
    cats,
    grand,
    grandPctNeg: grand > 0 ? grandNegWeighted / grand : 0,
  }
}

// ----------------------------------------------------------------------------
// Componente.
// ----------------------------------------------------------------------------

export interface TaxonomySunburstProps {
  data: TopicGroupRow[] | null | undefined
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Click en una sub-categoria (drill-down). categoria es la clave canonica. */
  onSelect?: (sel: { categoria: CategoryKey; sub: string }) => void
  className?: string
  /** Altura del SVG en px (cuadrado). Default 320. */
  size?: number
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat('es-MX').format(Math.round(n))
}

function fmtPct(n: number): string {
  return `${Math.round(n)}% neg`
}

export function TaxonomySunburst({
  data,
  isLoading = false,
  isError = false,
  onRetry,
  onSelect,
  className,
  size = 320,
}: TaxonomySunburstProps) {
  const [hover, setHover] = useState<{
    catKey: CategoryKey
    subKey?: string
    focus: FocusInfo
  } | null>(null)

  const model = useMemo(
    () => buildModel(Array.isArray(data) ? data : []),
    [data],
  )

  // --- Estados honestos: loading / error / empty / data ---
  if (isLoading) {
    return <SkeletonChart className={className} />
  }

  if (isError) {
    return (
      <ErrorState
        className={className}
        title="No se pudo cargar el mapa de temas"
        description="Hubo un problema al obtener la taxonomia de temas. Intenta de nuevo."
        onRetry={onRetry}
      />
    )
  }

  if (model.grand <= 0 || model.cats.length === 0) {
    return (
      <EmptyState
        className={className}
        title="Sin temas en el periodo"
        description="No hay menciones clasificadas en la taxonomia para el rango seleccionado."
      />
    )
  }

  // Centro: muestra el foco activo o el total agregado.
  const center: FocusInfo = hover?.focus ?? {
    label: 'menciones',
    count: model.grand,
    pctNeg: model.grandPctNeg,
  }

  const dim = hover !== null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-6',
        className,
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        role="img"
        aria-label="Mapa de temas: taxonomia politica de 7 categorias y sub-categorias"
        style={{ flex: 'none' }}
      >
        <g>
          {model.cats.map((c) => {
            const catHot =
              hover?.catKey === c.key && hover?.subKey === undefined
            const catActive = hover?.catKey === c.key
            return (
              <path
                key={`cat-${c.key}`}
                d={c.path}
                fill={c.fill}
                stroke="var(--bg-card)"
                strokeWidth={1}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity .16s var(--ease-out, ease)',
                  opacity: dim && !catActive ? 0.28 : 1,
                  outline: catHot ? '1px solid var(--bg-card)' : 'none',
                }}
                tabIndex={0}
                role="button"
                aria-label={`${c.label}: ${fmtInt(c.count)} menciones, ${fmtPct(c.pctNeg)}`}
                onMouseEnter={() =>
                  setHover({
                    catKey: c.key,
                    focus: {
                      label: c.label,
                      count: c.count,
                      pctNeg: c.pctNeg,
                    },
                  })
                }
                onFocus={() =>
                  setHover({
                    catKey: c.key,
                    focus: {
                      label: c.label,
                      count: c.count,
                      pctNeg: c.pctNeg,
                    },
                  })
                }
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
              />
            )
          })}

          {model.cats.flatMap((c) =>
            c.subs.map((s) => {
              const subHot =
                hover?.catKey === c.key && hover?.subKey === s.key
              const catActive = hover?.catKey === c.key
              return (
                <path
                  key={`sub-${c.key}-${s.key}`}
                  d={s.path}
                  fill={s.fill}
                  stroke="var(--bg-card)"
                  strokeWidth={1}
                  style={{
                    cursor: onSelect ? 'pointer' : 'default',
                    transition: 'opacity .16s var(--ease-out, ease)',
                    opacity: dim && !catActive ? 0.28 : 1,
                    outline: subHot ? '1px solid var(--bg-card)' : 'none',
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.label} / ${s.label}: ${fmtInt(s.count)} menciones, ${fmtPct(s.pctNeg)}`}
                  onMouseEnter={() =>
                    setHover({
                      catKey: c.key,
                      subKey: s.key,
                      focus: {
                        label: `${c.label} / ${s.label}`,
                        count: s.count,
                        pctNeg: s.pctNeg,
                      },
                    })
                  }
                  onFocus={() =>
                    setHover({
                      catKey: c.key,
                      subKey: s.key,
                      focus: {
                        label: `${c.label} / ${s.label}`,
                        count: s.count,
                        pctNeg: s.pctNeg,
                      },
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onBlur={() => setHover(null)}
                  onClick={() =>
                    onSelect?.({ categoria: c.key, sub: s.key })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect?.({ categoria: c.key, sub: s.key })
                    }
                  }}
                />
              )
            }),
          )}
        </g>

        {/* Disco central */}
        <circle
          cx={CX}
          cy={CY}
          r={R0 - 4}
          fill="var(--bg-card)"
          stroke="var(--border-subtle)"
        />
        <g textAnchor="middle" style={{ pointerEvents: 'none' }}>
          <text
            x={CX}
            y={CY - 4}
            fontSize={20}
            fontWeight={600}
            fill="var(--text-primary)"
            fontFamily="var(--font-mono, monospace)"
          >
            {fmtInt(center.count)}
          </text>
          <text
            x={CX}
            y={CY + 13}
            fontSize={9}
            fill="var(--text-tertiary)"
          >
            {center.label}
          </text>
          {center.count > 0 ? (
            <text
              x={CX}
              y={CY + 27}
              fontSize={9}
              fill="var(--text-tertiary)"
            >
              {fmtPct(center.pctNeg)}
            </text>
          ) : null}
        </g>
      </svg>

      {/* Tooltip flotante (sobre el SVG, esquina) + leyenda de categorias */}
      <div className="flex min-w-[180px] flex-col gap-2">
        {hover ? (
          <div
            className="rounded-md border border-border-subtle bg-elevated p-2 text-xs shadow-soft"
            role="status"
          >
            <div className="font-medium text-ink">{hover.focus.label}</div>
            <div className="font-mono tabular-nums text-ink-muted">
              {fmtInt(hover.focus.count)} menciones
            </div>
            <div className="font-mono tabular-nums text-ink-muted">
              {fmtPct(hover.focus.pctNeg)}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-ink-subtle">
            Pasa el cursor por los anillos. Color por categoria, intensidad
            por % negativo.
          </div>
        )}

        <ul className="flex flex-col gap-1" aria-label="Categorias">
          {model.cats.map((c) => {
            const active = hover?.catKey === c.key
            return (
              <li key={`lg-${c.key}`}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors',
                    active ? 'bg-sunken' : 'hover:bg-sunken',
                  )}
                  onMouseEnter={() =>
                    setHover({
                      catKey: c.key,
                      focus: {
                        label: c.label,
                        count: c.count,
                        pctNeg: c.pctNeg,
                      },
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onFocus={() =>
                    setHover({
                      catKey: c.key,
                      focus: {
                        label: c.label,
                        count: c.count,
                        pctNeg: c.pctNeg,
                      },
                    })
                  }
                  onBlur={() => setHover(null)}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 flex-none rounded-sm"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="flex-1 truncate text-ink">{c.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-ink-subtle">
                    {fmtInt(c.count)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export { CATEGORY_LABELS, SUB_LABELS, TAXONOMY }
export type { CategoryKey }

export default TaxonomySunburst
