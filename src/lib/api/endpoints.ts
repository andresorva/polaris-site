/**
 * Canonical backend endpoint paths.
 *
 * Source of truth: `/Users/mac/development/polaris/audits/2026-05-18-FRONTEND-CURRENT-STATE.md`
 * section 7.3 "Endpoint contract (paths)".
 *
 * Backend mounts all routers under prefix `/api/v1`.
 * NOTE: `timeseries` and `ppi` are documented under `/api/v1/politicians/{id}/metrics/...`
 * in the contract; real backend currently exposes them at `/api/v1/metrics/...` —
 * Wave B reconciles. Frontend hooks use these constants so reconciliation is one-line.
 */

export const ENDPOINTS = {
  health: '/health',
  politicians: '/api/v1/politicians',
  politicianById: (id: string) => `/api/v1/politicians/${id}`,
  sentimentBreakdown: (id: string) => `/api/v1/politicians/${id}/sentiment-breakdown`,
  topAuthors: (id: string) => `/api/v1/politicians/${id}/top-authors`,
  ppi: (id: string) => `/api/v1/politicians/${id}/metrics/ppi`,
  timeseries: (id: string) => `/api/v1/politicians/${id}/metrics/timeseries`,
  freshness: (id: string) => `/api/v1/politicians/${id}/freshness`,
  topics: (id: string) => `/api/v1/politicians/${id}/topics`,
  crisisSignals: (id: string) => `/api/v1/politicians/${id}/crisis-signals`,
  coordinationGroups: (id: string) => `/api/v1/politicians/${id}/coordination-groups`,
  dailyBrief: (id: string) => `/api/v1/politicians/${id}/daily-brief`,
  mentions: '/api/v1/mentions',
  liveQuery: '/api/v1/live-query',
} as const
