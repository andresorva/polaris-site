/**
 * Canonical backend endpoint paths.
 *
 * Source of truth verified via live curl 2026-05-18 against
 * https://web-production-d6505.up.railway.app
 *
 * Backend mounts all routers under prefix `/api/v1`.
 * Metrics endpoints live under `/api/v1/metrics/*` (NOT under
 * `/politicians/{id}/metrics/*` despite the audit's earlier contract).
 *  - `ppi/{id}` uses path param.
 *  - `timeseries` uses query param `politician_id=`.
 *  - `daily` uses query param `politician_id=`.
 */

export const ENDPOINTS = {
  health: '/health',
  politicians: '/api/v1/politicians',
  politicianById: (id: string) => `/api/v1/politicians/${id}`,
  sentimentBreakdown: (id: string) => `/api/v1/politicians/${id}/sentiment-breakdown`,
  topAuthors: (id: string) => `/api/v1/politicians/${id}/top-authors`,
  ppi: (id: string) => `/api/v1/metrics/ppi/${id}`,
  timeseries: '/api/v1/metrics/timeseries',
  metricsDaily: '/api/v1/metrics/daily',
  freshness: (id: string) => `/api/v1/politicians/${id}/freshness`,
  topics: (id: string) => `/api/v1/politicians/${id}/topics`,
  crisisSignals: (id: string) => `/api/v1/politicians/${id}/crisis-signals`,
  coordinationGroups: (id: string) => `/api/v1/politicians/${id}/coordination-groups`,
  dailyBrief: (id: string) => `/api/v1/politicians/${id}/daily-brief`,
  mentions: '/api/v1/mentions',
  alerts: '/api/v1/alerts',
  liveQuery: '/api/v1/live-query',
} as const
