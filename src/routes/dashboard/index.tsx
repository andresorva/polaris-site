import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function VistaGeneral() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Vista General"
        subtitle="KPIs principales + tendencias 30d"
      />
      <EmptyState
        title="Wireup pendiente Fase 3"
        description="Esta seccion conecta data real en Fase 3 (KPIs + grafica temporal + share of voice)."
      />
    </div>
  )
}

export default VistaGeneral
