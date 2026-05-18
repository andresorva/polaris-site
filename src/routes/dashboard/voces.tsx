import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Voces() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Voces"
        subtitle="Top influencers + ranking de autoridad"
      />
      <EmptyState
        title="Wireup pendiente Fase 4"
        description="Esta seccion conecta data real en Fase 4 (top autores + ranking + drill-down)."
      />
    </div>
  )
}

export default Voces
