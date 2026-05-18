import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Fuentes() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Fuentes"
        subtitle="Plataformas conectadas + status de scraping"
      />
      <EmptyState
        title="Wireup pendiente Fase 3"
        description="Esta seccion conecta data real en Fase 3 (lista de scrapers + status + ultima ingesta)."
      />
    </div>
  )
}

export default Fuentes
