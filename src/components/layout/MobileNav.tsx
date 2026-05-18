import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { NAV_ITEMS } from './navConfig'
import { cn } from '../../lib/utils/cn'

/**
 * Bottom tab bar para mobile (< md).
 * 4 primary tabs + "More" dropdown con el resto.
 */
export function MobileNav() {
  const primary = NAV_ITEMS.filter((i) => i.mobilePrimary).slice(0, 4)
  const overflow = NAV_ITEMS.filter((i) => !primary.includes(i))
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close "more" sheet on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  // Close on outside click / Escape
  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [moreOpen])

  const overflowHasActive = overflow.some((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  )

  return (
    <div
      ref={containerRef}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface"
    >
      {moreOpen ? (
        <div
          role="menu"
          aria-label="Mas secciones"
          className="absolute bottom-full inset-x-0 border-t border-border bg-surface-elevated shadow-lg"
        >
          <ul className="py-1">
            {overflow.map((item) => {
              const Icon = item.Icon
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    role="menuitem"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-medium',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-ink hover:bg-[var(--polaris-border)]',
                      )
                    }
                  >
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <nav aria-label="Navegacion mobile" className="flex items-stretch h-14">
        {primary.map((item) => {
          const Icon = item.Icon
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px]',
                  'focus-visible:outline-none focus-visible:bg-surface-elevated',
                  isActive ? 'text-primary' : 'text-ink-muted',
                )
              }
            >
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
              <span className="font-mono">{item.short ?? item.label}</span>
            </NavLink>
          )
        })}

        {overflow.length > 0 ? (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="Mas opciones"
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px]',
              'focus-visible:outline-none focus-visible:bg-surface-elevated',
              moreOpen || overflowHasActive ? 'text-primary' : 'text-ink-muted',
            )}
          >
            <MoreHorizontal size={20} strokeWidth={2} aria-hidden="true" />
            <span className="font-mono">Mas</span>
          </button>
        ) : null}
      </nav>
    </div>
  )
}
