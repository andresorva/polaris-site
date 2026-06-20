import { useEffect, useRef, useState } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FOOTER_NAV_ITEM, NAV_ITEMS, type NavItem } from './navConfig'
import { RadarMark } from './RadarMark'
import { ClientSelector } from '../../features/client-theme/ClientSelector'
import { useClientTheme } from '../../features/client-theme/useClientTheme'
import { useAuth } from '../../features/auth/useAuth'
import { useAlerts } from '../../lib/api/queries'
import { cn } from '../../lib/utils/cn'

/** Iniciales del usuario para el avatar de topbar. */
function userInitials(user: string | null): string {
  if (!user) return 'PL'
  const s = user.trim()
  if (s.includes('@')) return s.slice(0, 2).toUpperCase()
  const parts = s.split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

/** Swatches de party-switch: vende el theming multi-tenant en la topbar. */
function PartySwitch() {
  const { client, clients, setParty } = useClientTheme()
  return (
    <div className="party-switch" title="Cambia el cliente / partido">
      <span className="lbl">Cliente</span>
      {clients.map((c) => (
        <button
          key={c.id}
          type="button"
          className="sw2"
          // El color (currentColor + background) lo da la paleta del partido.
          style={{ background: c.primary, color: c.primary }}
          aria-pressed={c.id === client.id}
          aria-label={`Cambiar a ${c.display_name} (${c.party})`}
          title={`${c.display_name} - ${c.party}`}
          onClick={() => setParty(c.id)}
        />
      ))}
    </div>
  )
}

/** Toggle 1-boton sol/luna (claro <-> oscuro). Persiste via ThemeProvider. */
function ThemeToggleButton() {
  const { resolvedTheme, setMode } = useClientTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <button
      type="button"
      className="tb-icon"
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-pressed={isDark}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun size={17} strokeWidth={1.9} />
      ) : (
        <Moon size={17} strokeWidth={1.9} />
      )}
    </button>
  )
}

type SidebarLinkProps = {
  item: NavItem
  alertCount: number
  onNavigate: () => void
}

function SidebarLink({ item, alertCount, onNavigate }: SidebarLinkProps) {
  const Icon = item.Icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn('app-shell__nav-item', isActive && 'is-active')
      }
    >
      <span className="ind" aria-hidden="true" />
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
      {item.alertBadge && alertCount > 0 ? (
        <span
          className="pill inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-[#1a1208]"
          aria-label={`${alertCount} alertas`}
        >
          {alertCount}
        </span>
      ) : null}
    </NavLink>
  )
}

/**
 * AppShell — shell del dashboard (T0.3). Reemplaza DashboardLayout + MobileNav.
 *
 * Layout: CSS grid 252px + 1fr.
 *  - Sidebar sticky (desktop) / drawer lateral con backdrop (<=1024px). NO mas
 *    bottom-tab: el menu mobile es el mismo sidebar deslizando desde la izq.
 *  - Topbar dentro de <main> (glass, sticky): hamburguesa + client pill +
 *    party-switch + toggle sol/luna + avatar.
 *  - Sidebar: RadarMark + nav con indicador activo + badge de alertas + Ajustes.
 *
 * Preserva el contrato de rutas: el <Outlet/> renderiza la ruta activa de React
 * Router (el auth guard RequireAuth sigue envolviendo este shell en App.tsx).
 */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const { user, logout } = useAuth()
  const { client } = useClientTheme()
  const location = useLocation()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Badge de alertas en el sidebar: conteo real por cliente activo. Si la API
  // esta dead/cargando, data === undefined -> 0 -> el badge no se muestra.
  const { data: alerts } = useAlerts(client.politician_id)
  const alertCount = alerts?.length ?? 0

  // Cierra el drawer al cambiar de ruta (navegacion mobile).
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Cierra el drawer con Escape.
  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])

  // Menu de usuario (avatar): cierra al click afuera / Escape.
  useEffect(() => {
    if (!userMenuOpen) return
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  return (
    <div className={cn('app-shell', navOpen && 'is-nav-open')}>
      {/* ---------- Sidebar / drawer ---------- */}
      <aside className="app-shell__sidebar" aria-label="Navegacion principal">
        <div className="sb-brand">
          <RadarMark size={30} withBlip />
          <div className="nm">
            POLARIS
            <small>v2.0</small>
          </div>
        </div>

        <div className="sb-section">Monitoreo</div>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            alertCount={alertCount}
            onNavigate={() => setNavOpen(false)}
          />
        ))}

        <div className="sb-foot">
          <SidebarLink
            item={FOOTER_NAV_ITEM}
            alertCount={0}
            onNavigate={() => setNavOpen(false)}
          />
        </div>
      </aside>

      {/* ---------- Main (topbar + contenido) ---------- */}
      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <button
            type="button"
            className="tb-icon sb-toggle"
            aria-label={navOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? (
              <X size={18} strokeWidth={2} />
            ) : (
              <Menu size={18} strokeWidth={2} />
            )}
          </button>

          <ClientSelector />

          <div className="tb-spacer" />

          <div className="hidden md:block">
            <PartySwitch />
          </div>

          <ThemeToggleButton />

          {/* Avatar + menu de usuario (sesion / logout) */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              className="avatar"
              style={{ width: 36, height: 36 }}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="Menu de usuario"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              {userInitials(user)}
            </button>

            {userMenuOpen ? (
              <div
                role="menu"
                aria-label="Acciones de usuario"
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-elevated shadow-strong"
              >
                <div className="border-b border-border px-3 py-2">
                  <p className="text-[11px] font-mono text-ink-subtle">Sesion</p>
                  <p className="truncate text-sm font-medium text-ink">
                    {user ?? '-'}
                  </p>
                </div>
                <div className="border-b border-border px-3 py-2 md:hidden">
                  <p className="mb-1.5 text-[11px] font-mono text-ink-subtle">
                    Cliente
                  </p>
                  <PartySwitch />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-[var(--bg-hover)]"
                >
                  Cerrar sesion
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Backdrop del drawer (solo mobile, controlado por CSS) */}
      <button
        type="button"
        className="app-shell__backdrop"
        aria-label="Cerrar menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />
    </div>
  )
}

export default AppShell
