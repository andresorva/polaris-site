import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/states/EmptyState'

export function Briefing() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Briefing"
        subtitle="Resumen ejecutivo diario + export PDF"
      />
      <EmptyState
        title="Wireup pendiente Fase 5"
        description="Esta seccion conecta data real en Fase 5 (LLM-generated briefing + export PDF/email)."
      />
    </div>
  )
}

export default Briefing
