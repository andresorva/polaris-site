import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Alertas() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Alertas"
        subtitle="Anomalias detectadas + reglas de notificacion"
      />
      <EmptyState
        title="Wireup pendiente Fase 5"
        description="Esta seccion conecta data real en Fase 5 (anomaly detection + alertas activas)."
      />
    </div>
  )
}

export default Alertas
