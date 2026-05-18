/**
 * Global filters store (Zustand + persist).
 *
 * Scope: filters shared across dashboard views (time range, future: platform filter,
 * sentiment filter, etc.). Per-page transient state stays as local component state.
 *
 * IMPORTANT: Client/theme state lives in `src/features/client-theme/` — do NOT
 * duplicate here. This store is for *data* filters only.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all'

export interface FiltersState {
  timeRange: TimeRange
  setTimeRange: (r: TimeRange) => void
  reset: () => void
}

const DEFAULTS: Pick<FiltersState, 'timeRange'> = {
  timeRange: '30d',
}

export const useFilters = create<FiltersState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTimeRange: (timeRange) => set({ timeRange }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'polaris_filters',
      version: 1,
    },
  ),
)

/**
 * Convert a `TimeRange` to a day count for API params.
 * `'all'` returns `undefined` so callers can omit the param entirely.
 */
export function timeRangeToDays(range: TimeRange): number | undefined {
  switch (range) {
    case '24h':
      return 1
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case '1y':
      return 365
    case 'all':
      return undefined
  }
}
