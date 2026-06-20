/**
 * Voces y criticos - mockup 08-voces-criticos.
 *
 * Quien me menciona, quien me ataca, quien me defiende. Compone los cuatro
 * paneles documentados (CriticsTable / DefendersList / CriticsNetwork /
 * CoordinationGroups), todos presentacionales y auto-estado (loading / error /
 * empty / data los maneja cada componente). Esta ruta solo orquesta filtros y
 * cablea las queries.
 *
 * Data real:
 *   - Top voces criticas + Top defensores + Mapa recurrentes -> useTopAuthors
 *     (sinteticas 'MX' + google_trends ya excluidas por los componentes).
 *   - Deteccion de coordinacion -> useCoordinationGroups (detector backend en
 *     proceso; cuando no hay grupos el panel muestra empty-state honesto).
 *
 * Aristas autor-a-autor: API PENDIENTE (el backend no expone relaciones todavia)
 * -> CriticsNetwork renderiza solo nodos, cero data fabricada.
 *
 * REGLA 79: ASCII-only en todo string visible. Sin acentos ni n-con-tilde.
 */

import { useState, type ReactNode } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { cn } from '../../lib/utils/cn'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import {
  useCoordinationGroups,
  useTopAuthors,
} from '../../lib/api/queries'
import type { TopAuthorsScope } from '../../lib/api/types'
import { CriticsTable } from '../../components/data-display/CriticsTable'
import { DefendersList } from '../../components/data-display/DefendersList'
import { CriticsNetwork } from '../../components/data-display/CriticsNetwork'
import { CoordinationGroups } from '../../components/data-display/CoordinationGroups'
import { DemoBadge } from '../../components/states/DemoBadge'

// ---------------------------------------------------------------------------
// Scope tabs (Terceros / Todos / Comentarios). El backend solo soporta estos
// tres valores (no 'Propio'), asi evitamos 400s.
// ---------------------------------------------------------------------------

const SCOPES: Array<{ value: TopAuthorsScope; label: string }> = [
  { value: 'third_party', label: 'Terceros' },
  { value: 'all', label: 'Todos' },
  { value: 'comments', label: 'Comentarios' },
]

const WINDOW_DAYS = 30

// ---------------------------------------------------------------------------
// Panel header (titulo + hint a la derecha, como el mockup)
// ---------------------------------------------------------------------------

function PanelHead({
  title,
  hint,
  badge,
}: {
  title: string
  hint?: string
  badge?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="text-sm font-semibold text-ink truncate">{title}</h3>
        {badge}
      </div>
      {hint ? (
        <span className="text-xs text-ink-muted shrink-0">{hint}</span>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Voces route
// ---------------------------------------------------------------------------

export function Voces() {
  const { client } = useClientTheme()
  const politicianId = client.politician_id

  const [scope, setScope] = useState<TopAuthorsScope>('third_party')

  // Criticos + mapa recurrentes: respetan el scope del tab.
  const criticsQ = useTopAuthors(politicianId, {
    limit: 50,
    days: WINDOW_DAYS,
    scope,
  })

  // Defensores: siempre scope='all' para no perder voces a favor que caen fuera
  // de 'terceros' (heuristica honesta vive dentro de DefendersList).
  const defendersQ = useTopAuthors(politicianId, {
    limit: 50,
    days: WINDOW_DAYS,
    scope: 'all',
  })

  const coordQ = useCoordinationGroups(politicianId)

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Voces y criticos"
        subtitle="Quien me menciona, quien me ataca, quien me defiende. Mapa de cuentas recurrentes y deteccion de coordinacion."
      />

      {/* Scope tabs */}
      <div
        role="radiogroup"
        aria-label="Scope de menciones"
        className="inline-flex flex-wrap gap-1 p-1 mb-6 rounded-full border border-border-subtle bg-surface"
      >
        {SCOPES.map((opt) => {
          const active = scope === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setScope(opt.value)}
              className={cn(
                'h-8 px-4 rounded-full text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Row 1: Top voces criticas + Top defensores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <PanelHead
            title="Top 12 voces criticas"
            hint={`${WINDOW_DAYS}d · click para ordenar`}
          />
          <CriticsTable
            authors={criticsQ.data?.authors}
            loading={criticsQ.isLoading}
            error={criticsQ.isError}
            onRetry={() => criticsQ.refetch()}
            limit={12}
          />
        </Card>

        <Card>
          <PanelHead title="Top defensores" hint="pro-cliente" />
          <DefendersList
            authors={defendersQ.data?.authors}
            loading={defendersQ.isLoading}
            error={defendersQ.isError}
            onRetry={() => defendersQ.refetch()}
            limit={4}
          />
        </Card>
      </div>

      {/* Row 2: Mapa de criticos recurrentes + Deteccion de coordinacion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <PanelHead
            title="Mapa de criticos recurrentes"
            hint="nodo = cuenta · color = % neg"
          />
          {/* Aristas autor-a-autor: API PENDIENTE -> solo nodos, sin edges */}
          <CriticsNetwork
            authors={criticsQ.data?.authors}
            loading={criticsQ.isLoading}
            error={criticsQ.isError}
            onRetry={() => criticsQ.refetch()}
            minNegative={3}
            maxNodes={10}
          />
        </Card>

        <Card>
          <PanelHead
            title="Deteccion de coordinacion"
            hint="posible red"
            // DemoBadge: detector aun en proceso (Wave B). Cuando no hay grupos
            // muestra empty-state; el badge avisa que el panel puede traer
            // senales sinteticas/incompletas mientras se cablea el detector real.
            badge={<DemoBadge label="BETA" />}
          />
          <CoordinationGroups
            groups={coordQ.data?.groups}
            loading={coordQ.isLoading}
            error={coordQ.isError}
            onRetry={() => coordQ.refetch()}
          />
        </Card>
      </div>
    </div>
  )
}

export default Voces
