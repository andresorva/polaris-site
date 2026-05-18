import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

/**
 * Shell del dashboard:
 * - Topbar fijo arriba.
 * - Sidebar a la izquierda en md+.
 * - MobileNav fijo abajo en < md.
 * - Outlet renderiza la ruta activa.
 */
export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main
          id="main"
          className="flex-1 min-w-0 overflow-y-auto pb-14 md:pb-0"
        >
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export default DashboardLayout
