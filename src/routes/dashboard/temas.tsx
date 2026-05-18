import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Temas() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Temas"
        subtitle="Topics clustering + tendencias + impacto"
      />
      <EmptyState
        title="Wireup pendiente Fase 4"
        description="Esta seccion conecta data real en Fase 4 (topics + clustering + drill-down)."
      />
    </div>
  )
}

export default Temas
