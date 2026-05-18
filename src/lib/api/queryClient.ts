/**
 * Shared TanStack Query client instance.
 *
 * The Provider wrapper lives in `App.tsx` (Fase 2 agent owns App routing).
 * This module ONLY exports the instance.
 *
 * Defaults:
 * - staleTime 5 min — most POLARIS data refreshes hourly/daily, 5min is safe
 * - gcTime 10 min — keep cache around for fast back-nav
 * - retry 2 — apiGet already retries network/5xx 3x with backoff; this is fallback for query errors
 * - refetchOnWindowFocus false — political data isn't tick-by-tick critical
 */

import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry 4xx (client errors) — apiGet already handles 5xx with backoff.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
