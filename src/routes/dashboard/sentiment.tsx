import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Sentiment() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Sentimiento"
        subtitle="Distribucion + evolucion temporal + drivers"
      />
      <EmptyState
        title="Wireup pendiente Fase 3"
        description="Esta seccion conecta data real en Fase 3 (sentiment timeseries + donut + drivers por tema)."
      />
    </div>
  )
}

export default Sentiment
