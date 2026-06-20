/**
 * CriticsNetwork - "Mapa de criticos recurrentes" (mockup 08-voces).
 *
 * Each node is a recurrent critic account: radius scales with mention count,
 * fill color ramps green -> red by % negative (via --sent-* CSS vars). Hovering
 * a node highlights it and dims the rest.
 *
 * HONESTY NOTE: the backend exposes NO author-to-author relationship/edge
 * endpoint today. We therefore DO NOT fabricate edges. The graph renders nodes
 * only (a deterministic radial layout from real data) and shows an explicit
 * "relaciones API PENDIENTE" hint. When Wave 2/backend ships an edges payload,
 * pass `edges` and they render with the same hover-dim interaction.
 *
 * REGLA 79: ASCII-only in every visible string.
 */

import { useId, useMemo, useState } from 'react'
import { Network } from 'lucide-react'
import type { TopAuthor } from '../../lib/api/types'
import { cn } from '../../lib/utils/cn'
import { isSyntheticAuthor } from './CriticsTable'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { SkeletonChart } from '../states/LoadingSkeleton'

const VIEW_W = 480
const VIEW_H = 340

type NetNode = {
  id: string
  label: string
  x: number
  y: number
  r: number
  pctNeg: number
  count: number
}

/** Edge between two node ids (API PENDIENTE: not produced by backend yet). */
export type NetworkEdge = { a: string; b: string }

function toPct(raw: number): number {
  const v = raw <= 1 ? raw * 100 : raw
  return Math.max(0, Math.min(100, v))
}

function negColor(pct: number): string {
  return `color-mix(in srgb, var(--sent-negative) ${pct}%, var(--sent-positive))`
}

function shortLabel(handle: string): string {
  const clean = handle.replace(/^@/, '')
  return clean.length > 12 ? `${clean.slice(0, 11)}.` : clean
}

// Deterministic radial layout: biggest (most mentions) toward the center,
// spread on a ring. No physics dependency, no randomness -> stable render.
function layout(authors: TopAuthor[], max: number): NetNode[] {
  const top = [...authors].sort((a, b) => b.count - a.count).slice(0, max)
  const cx = VIEW_W / 2
  const cy = VIEW_H / 2
  const n = top.length
  return top.map((a, i) => {
    const pct = toPct(a.pct_negative)
    const r = 7 + Math.min(a.count, 14) * 1.8
    if (i === 0 && n > 2) {
      return {
        id: a.author ?? `n${i}`,
        label: shortLabel(a.author ?? ''),
        x: cx,
        y: cy,
        r,
        pctNeg: pct,
        count: a.count,
      }
    }
    const ringIndex = n > 2 ? i - 1 : i
    const ringCount = n > 2 ? n - 1 : n
    const angle = (ringIndex / Math.max(1, ringCount)) * Math.PI * 2 - Math.PI / 2
    const radius = Math.min(VIEW_W, VIEW_H) / 2 - 48
    return {
      id: a.author ?? `n${i}`,
      label: shortLabel(a.author ?? ''),
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius * 0.82,
      r,
      pctNeg: pct,
      count: a.count,
    }
  })
}

export type CriticsNetworkProps = {
  authors: TopAuthor[] | undefined
  /** Optional real edges. Absent today -> graph renders nodes only. */
  edges?: NetworkEdge[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Min negative mentions for an author to count as "recurrent". */
  minNegative?: number
  /** Max nodes to render. */
  maxNodes?: number
  className?: string
}

export function CriticsNetwork({
  authors,
  edges,
  loading = false,
  error = false,
  onRetry,
  minNegative = 3,
  maxNodes = 10,
  className,
}: CriticsNetworkProps) {
  const titleId = useId()
  const [activeId, setActiveId] = useState<string | null>(null)

  const nodes = useMemo(() => {
    const recurrent = (authors ?? []).filter(
      (a) => !isSyntheticAuthor(a) && a.negative >= minNegative,
    )
    return layout(recurrent, maxNodes)
  }, [authors, minNegative, maxNodes])

  const nmap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  )

  // Only keep edges whose endpoints both exist as nodes.
  const realEdges = useMemo(
    () => (edges ?? []).filter((e) => nmap[e.a] && nmap[e.b]),
    [edges, nmap],
  )

  const linked = useMemo(() => {
    if (!activeId) return null
    const set = new Set<string>([activeId])
    for (const e of realEdges) {
      if (e.a === activeId) set.add(e.b)
      if (e.b === activeId) set.add(e.a)
    }
    return set
  }, [activeId, realEdges])

  if (loading) return <SkeletonChart className={className} />
  if (error)
    return (
      <ErrorState
        className={className}
        title="No se pudo cargar el mapa"
        description="Hubo un problema al traer las cuentas recurrentes. Intenta de nuevo."
        onRetry={onRetry}
      />
    )
  if (nodes.length === 0)
    return (
      <EmptyState
        className={className}
        icon={<Network size={48} strokeWidth={1.5} />}
        title="Sin cuentas recurrentes"
        description={`Ningun autor alcanza ${minNegative}+ menciones negativas en la ventana actual.`}
      />
    )

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full block"
        style={{ height: VIEW_H }}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          Mapa de cuentas criticas recurrentes. Nodo igual a cuenta, tamano por
          numero de menciones, color por porcentaje negativo.
        </title>
        {realEdges.length > 0 ? (
          <g>
            {realEdges.map((e, i) => {
              const a = nmap[e.a]
              const b = nmap[e.b]
              const on = !linked || (linked.has(e.a) && linked.has(e.b))
              return (
                <line
                  key={`e${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={
                    on && activeId
                      ? 'var(--polaris-primary)'
                      : 'var(--polaris-border)'
                  }
                  strokeWidth={1}
                  style={{ opacity: on ? 1 : 0.12, transition: 'opacity .16s' }}
                />
              )
            })}
          </g>
        ) : null}
        <g>
          {nodes.map((n) => {
            const off = linked ? !linked.has(n.id) : false
            return (
              <g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveId(n.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(n.id)}
                onBlur={() => setActiveId(null)}
                tabIndex={0}
                role="img"
                aria-label={`${n.label}: ${n.count} menciones, ${n.pctNeg.toFixed(0)} por ciento negativo`}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={negColor(n.pctNeg)}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                  style={{ opacity: off ? 0.25 : 1, transition: 'opacity .16s' }}
                />
                <text
                  x={n.x}
                  y={n.y + n.r + 11}
                  textAnchor="middle"
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    fill: 'var(--polaris-text-muted)',
                    opacity: off ? 0.25 : 1,
                    transition: 'opacity .16s',
                  }}
                >
                  {n.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      <p
        className={cn(
          'mt-1 text-[10px] italic',
          realEdges.length > 0 ? 'text-ink-subtle' : 'text-ink-muted',
        )}
      >
        {realEdges.length > 0
          ? 'Lineas: relaciones entre cuentas. Pasa el cursor para resaltar.'
          : 'Relaciones entre cuentas: API PENDIENTE. Se muestran nodos sin aristas (cero data fabricada).'}
      </p>
    </div>
  )
}

export default CriticsNetwork
