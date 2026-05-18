import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

type Props = {
  children: ReactNode
}

/**
 * Wrapper que redirige a /login si no hay sesion activa.
 * Preserva la ruta destino en location.state.from para post-login redirect.
 */
export function RequireAuth({ children }: Props) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
