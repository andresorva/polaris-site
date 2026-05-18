import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NAV_ITEMS } from './navConfig'
import { cn } from '../../lib/utils/cn'

const STORAGE_KEY = 'polaris_sidebar_collapsed'

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

type Props = {
  className?: string
}

/**
 * Desktop / tablet sidebar.
 * - Hidden on mobile (< md) — replaced by <MobileNav>.
 * - Tablet (md: 768-1024): defaults to collapsed (icon-only), user can expand.
 * - Desktop (lg+): defaults to expanded, user can collapse to icons.
 */
export function Sidebar({ className }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return (
    <aside
      aria-label="Navegacion principal"
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r border-border bg-surface',
        'transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
        className,
      )}
    >
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.Icon
            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium',
                      'transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-ink-muted hover:bg-surface-elevated hover:text-ink',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  <span
                    className={cn(
                      'truncate transition-opacity',
                      collapsed && 'sr-only',
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          aria-expanded={!collapsed}
          className={cn(
            'flex items-center gap-2 w-full rounded-md px-2 py-2 text-xs font-mono',
            'text-ink-muted hover:bg-surface-elevated hover:text-ink',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={2} />
          ) : (
            <>
              <ChevronLeft size={16} strokeWidth={2} />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
