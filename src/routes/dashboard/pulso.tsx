import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Pulso() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Pulso en vivo"
        subtitle="Stream de menciones en tiempo real + auto-refresh"
      />
      <EmptyState
        title="Wireup pendiente Fase 3"
        description="Esta seccion conecta data real en Fase 3 (stream live + auto-refresh 30s)."
      />
    </div>
  )
}

export default Pulso
