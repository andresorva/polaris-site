import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { ClientSelector } from '../../features/client-theme/ClientSelector'
import { TimeRangeSelector } from '../selectors/TimeRangeSelector'
import { ThemeToggle } from '../selectors/ThemeToggle'
import { useAuth } from '../../features/auth/useAuth'
import { cn } from '../../lib/utils/cn'

export function Topbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-ink">
            POLARIS
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="hidden sm:block">
            <ClientSelector />
          </div>
          <div className="hidden md:block">
            <TimeRangeSelector />
          </div>
          <ThemeToggle />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu de usuario"
              className={cn(
                'inline-flex items-center justify-center h-8 w-8 rounded-full',
                'border border-border bg-surface-elevated text-ink-muted',
                'hover:bg-[var(--polaris-border)] hover:text-ink',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <User size={16} strokeWidth={2} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                aria-label="Acciones de usuario"
                className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-surface-elevated shadow-lg overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[11px] font-mono text-ink-subtle">
                    Sesion
                  </p>
                  <p className="text-sm font-medium text-ink truncate">
                    {user ?? '—'}
                  </p>
                </div>
                <div className="sm:hidden border-b border-border px-3 py-2">
                  <p className="text-[11px] font-mono text-ink-subtle mb-1">
                    Cliente
                  </p>
                  <ClientSelector />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink hover:bg-[var(--polaris-border)] focus-visible:outline-none focus-visible:bg-[var(--polaris-border)]"
                >
                  <LogOut size={14} strokeWidth={2} />
                  <span>Cerrar sesion</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
