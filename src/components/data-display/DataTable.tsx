import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/utils/cn'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

/**
 * DataTable<T> — reusable, generic table.
 *
 * Features:
 * - Local-state filter (full-text against `searchKeys`).
 * - Sortable columns (when `sortable: true`).
 * - Client-side pagination.
 * - Responsive: <table> on >= md, <Card> list on mobile.
 *
 * Pagination/sort/filter all operate on the data passed in — caller is
 * responsible for fetching. This is intentional: keeps the component
 * presentation-only and works with TanStack Query elsewhere.
 */

export type Column<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
  /** Custom accessor for sorting; defaults to whatever `render` produces */
  sortAccessor?: (row: T) => string | number | null | undefined
  sortable?: boolean
  width?: string
  /** Hide column on mobile card layout (only relevant for table view) */
  mobileHidden?: boolean
  /** Label shown above the value in mobile card layout */
  mobileLabel?: string
}

type SortDir = 'asc' | 'desc'

type Props<T> = {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchKeys?: (keyof T)[]
  emptyMessage?: string
  /** Optional placeholder for the search input */
  searchPlaceholder?: string
  /** Controlled search value (optional). When provided, overrides internal state. */
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Default sort key (must match a sortable column.key) */
  initialSortKey?: string
  initialSortDir?: SortDir
  /** When true, hide the built-in search input (caller renders own filters bar) */
  hideSearch?: boolean
  className?: string
}

function getSearchableString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(getSearchableString).join(' ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return String(value)
}

function compareValues(a: unknown, b: unknown): number {
  // null/undefined sort last regardless of direction (multiplied by dir later)
  const aNil = a === null || a === undefined || a === ''
  const bNil = b === null || b === undefined || b === ''
  if (aNil && bNil) return 0
  if (aNil) return 1
  if (bNil) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  pageSize = 20,
  searchKeys,
  emptyMessage = 'Sin resultados',
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  initialSortKey,
  initialSortDir = 'desc',
  hideSearch = false,
  className,
}: Props<T>) {
  const [internalSearch, setInternalSearch] = useState('')
  const search = searchValue !== undefined ? searchValue : internalSearch
  const setSearch = (v: string) => {
    if (onSearchChange) onSearchChange(v)
    else setInternalSearch(v)
  }

  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null)
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir)
  const [page, setPage] = useState(0)

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim() || !searchKeys || searchKeys.length === 0) return data
    const needle = search.trim().toLowerCase()
    return data.filter((row) =>
      searchKeys.some((k) =>
        getSearchableString(row[k]).toLowerCase().includes(needle),
      ),
    )
  }, [data, search, searchKeys])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return filtered
    const accessor =
      col.sortAccessor ??
      ((row: T) => {
        const v = (row as unknown as Record<string, unknown>)[col.key]
        return typeof v === 'string' || typeof v === 'number' ? v : undefined
      })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => compareValues(accessor(a), accessor(b)) * dir)
  }, [filtered, sortKey, sortDir, columns])

  // Reset page on filter/sort change
  const filteredKey = `${search}|${sortKey ?? ''}|${sortDir}|${data.length}`
  const [lastFilteredKey, setLastFilteredKey] = useState(filteredKey)
  if (filteredKey !== lastFilteredKey) {
    setLastFilteredKey(filteredKey)
    if (page !== 0) setPage(0)
  }

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const start = currentPage * pageSize
  const pageData = sorted.slice(start, start + pageSize)

  function toggleSort(colKey: string) {
    if (sortKey === colKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(colKey)
      setSortDir('desc')
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {hideSearch ? null : (
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filtrar tabla"
        />
      )}

      {/* Mobile card list (<md) */}
      <div className="md:hidden space-y-3">
        {pageData.length === 0 ? (
          <div className="text-center text-sm text-ink-muted py-8 border border-border rounded-lg bg-surface-elevated">
            {emptyMessage}
          </div>
        ) : (
          pageData.map((row) => (
            <div
              key={row.id}
              className="border border-border rounded-lg bg-surface-elevated p-3 space-y-2"
            >
              {columns.map((col) => (
                <div key={col.key} className="text-sm">
                  <div className="text-[10px] font-mono uppercase tracking-wide text-ink-subtle">
                    {col.mobileLabel ?? col.label}
                  </div>
                  <div className="text-ink">{col.render(row)}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop table (>= md) */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                {columns.map((col) => {
                  const isActive = sortKey === col.key
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(
                        'text-left font-semibold text-ink-muted text-xs uppercase tracking-wide px-3 py-2',
                        col.mobileHidden && 'hidden lg:table-cell',
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'inline-flex items-center gap-1 hover:text-ink transition-colors',
                            isActive && 'text-ink',
                          )}
                          aria-sort={
                            isActive
                              ? sortDir === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                        >
                          <span>{col.label}</span>
                          {isActive ? (
                            sortDir === 'asc' ? (
                              <ChevronUp size={12} aria-hidden="true" />
                            ) : (
                              <ChevronDown size={12} aria-hidden="true" />
                            )
                          ) : (
                            <ChevronsUpDown
                              size={12}
                              className="opacity-50"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center text-sm text-ink-muted py-8"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageData.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-border last:border-b-0',
                      idx % 2 === 1 && 'bg-surface-elevated/40',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-3 py-2 align-top text-ink',
                          col.mobileHidden && 'hidden lg:table-cell',
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs font-mono text-ink-subtle tabular-nums">
            {start + 1}-{Math.min(start + pageSize, sorted.length)} de {sorted.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              aria-label="Pagina anterior"
            >
              Anterior
            </Button>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Pagina siguiente"
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
