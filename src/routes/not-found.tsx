import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/states/EmptyState'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-ink p-4">
      <div className="w-full max-w-md">
        <EmptyState
          title="404 — Ruta no encontrada"
          description="La ruta solicitada no existe en POLARIS. Verifica la URL o vuelve al dashboard."
          icon={<Compass size={48} strokeWidth={1.5} />}
          cta={{
            label: 'Ir al dashboard',
            onClick: () => navigate('/dashboard', { replace: true }),
          }}
        />
      </div>
    </div>
  )
}

export default NotFound
