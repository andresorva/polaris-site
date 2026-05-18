/**
 * TanStack Query hooks for POLARIS API.
 *
 * Conventions:
 * - queryKey = [resource, ...identifiers, ...filterParams] so cache invalidation
 *   per politician + per filter combo is trivial.
 * - `enabled: !!id` guards prevent fetches when ids aren't ready (e.g. before
 *   route param resolves).
 * - Hooks accept optional filter params; default values mirror backend defaults.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  Alert,
  CoordinationGroupsResponse,
  CrisisSignalsResponse,
  DailyBrief,
  DailyMetricsResponse,
  Freshness,
  Health,
  LiveQueryRequest,
  LiveQueryResponse,
  Mention,
  PPI,
  Politician,
  SentimentBreakdown,
  SentimentScope,
  Timeseries,
  TimeseriesInterval,
  TopAuthorsResponse,
  TopAuthorsScope,
  TopicsResponse,
} from './types'

// ============================================================================
// Politicians
// ============================================================================

export function usePoliticians() {
  return useQuery({
    queryKey: ['politicians'],
    queryFn: () => apiGet<Politician[]>(ENDPOINTS.politicians),
  })
}

export function usePolitician(id: string) {
  return useQuery({
    queryKey: ['politician', id],
    queryFn: () => apiGet<Politician>(ENDPOINTS.politicianById(id)),
    enabled: !!id,
  })
}

// ============================================================================
// Metrics
// ============================================================================

export function usePPI(politicianId: string) {
  return useQuery({
    queryKey: ['ppi', politicianId],
    queryFn: () => apiGet<PPI>(ENDPOINTS.ppi(politicianId)),
    enabled: !!politicianId,
  })
}

interface TimeseriesOptions {
  interval?: TimeseriesInterval
  days?: number
  since?: string
  until?: string
}

export function useTimeseries(politicianId: string, options: TimeseriesOptions = {}) {
  const { interval = 'day', days = 7, since, until } = options
  return useQuery({
    queryKey: ['timeseries', politicianId, interval, days, since, until],
    queryFn: () =>
      apiGet<Timeseries>(ENDPOINTS.timeseries, {
        politician_id: politicianId,
        interval,
        days,
        ...(since ? { since } : {}),
        ...(until ? { until } : {}),
      }),
    enabled: !!politicianId,
  })
}

export function useDailyMetrics(politicianId: string, days = 30) {
  return useQuery({
    queryKey: ['metrics-daily', politicianId, days],
    queryFn: () =>
      apiGet<DailyMetricsResponse>(ENDPOINTS.metricsDaily, {
        politician_id: politicianId,
        days,
      }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Sentiment + authors
// ============================================================================

interface SentimentBreakdownOptions {
  scope?: SentimentScope
  days?: number
}

export function useSentimentBreakdown(
  politicianId: string,
  options: SentimentBreakdownOptions = {},
) {
  const { scope = 'all', days = 30 } = options
  return useQuery({
    queryKey: ['sentiment-breakdown', politicianId, scope, days],
    queryFn: () =>
      apiGet<SentimentBreakdown>(ENDPOINTS.sentimentBreakdown(politicianId), {
        scope,
        days,
      }),
    enabled: !!politicianId,
  })
}

interface TopAuthorsOptions {
  limit?: number
  days?: number
  scope?: TopAuthorsScope
}

export function useTopAuthors(politicianId: string, options: TopAuthorsOptions = {}) {
  const { limit = 10, days = 30, scope = 'third_party' } = options
  return useQuery({
    queryKey: ['top-authors', politicianId, limit, days, scope],
    queryFn: () =>
      apiGet<TopAuthorsResponse>(ENDPOINTS.topAuthors(politicianId), {
        limit,
        days,
        scope,
      }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Mentions
// ============================================================================

interface MentionsOptions {
  limit?: number
  offset?: number
  platform?: string
  is_own_content?: boolean
  has_parent?: boolean
  parent_external_id?: string
}

export function useMentions(politicianId: string, options: MentionsOptions = {}) {
  const {
    limit = 50,
    offset = 0,
    platform,
    is_own_content,
    has_parent,
    parent_external_id,
  } = options
  return useQuery({
    queryKey: [
      'mentions',
      politicianId,
      limit,
      offset,
      platform,
      is_own_content,
      has_parent,
      parent_external_id,
    ],
    queryFn: () =>
      apiGet<Mention[]>(ENDPOINTS.mentions, {
        politician_id: politicianId,
        limit,
        offset,
        ...(platform ? { platform } : {}),
        ...(is_own_content !== undefined ? { is_own_content } : {}),
        ...(has_parent !== undefined ? { has_parent } : {}),
        ...(parent_external_id ? { parent_external_id } : {}),
      }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Topics / Freshness / Daily brief
// ============================================================================

interface TopicsOptions {
  days?: number
}

export function useTopics(politicianId: string, options: TopicsOptions = {}) {
  const { days = 7 } = options
  return useQuery({
    queryKey: ['topics', politicianId, days],
    queryFn: () => apiGet<TopicsResponse>(ENDPOINTS.topics(politicianId), { days }),
    enabled: !!politicianId,
  })
}

export function useFreshness(politicianId: string) {
  return useQuery({
    queryKey: ['freshness', politicianId],
    queryFn: () => apiGet<Freshness>(ENDPOINTS.freshness(politicianId)),
    enabled: !!politicianId,
    // Freshness is most useful when "current" — refresh more aggressively.
    staleTime: 60 * 1000,
  })
}

export function useDailyBrief(politicianId: string, date?: string) {
  return useQuery({
    queryKey: ['daily-brief', politicianId, date ?? 'today'],
    queryFn: () =>
      apiGet<DailyBrief>(
        ENDPOINTS.dailyBrief(politicianId),
        date ? { date } : undefined,
      ),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Crisis + coordination
// ============================================================================

export function useCrisisSignals(politicianId: string, hours = 24) {
  return useQuery({
    queryKey: ['crisis-signals', politicianId, hours],
    queryFn: () =>
      apiGet<CrisisSignalsResponse>(ENDPOINTS.crisisSignals(politicianId), { hours }),
    enabled: !!politicianId,
  })
}

interface CoordinationOptions {
  active_only?: boolean
  limit?: number
}

export function useCoordinationGroups(
  politicianId: string,
  options: CoordinationOptions = {},
) {
  const { active_only = true, limit = 20 } = options
  return useQuery({
    queryKey: ['coordination-groups', politicianId, active_only, limit],
    queryFn: () =>
      apiGet<CoordinationGroupsResponse>(ENDPOINTS.coordinationGroups(politicianId), {
        active_only,
        limit,
      }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Alerts
// ============================================================================

export function useAlerts(politicianId: string) {
  return useQuery({
    queryKey: ['alerts', politicianId],
    queryFn: () =>
      apiGet<Alert[]>(ENDPOINTS.alerts, { politician_id: politicianId }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Health
// ============================================================================

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<Health>(ENDPOINTS.health),
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// Live Query (POST)
// ============================================================================

/**
 * Trigger function for Live Query — not a hook because mutations are imperative.
 * Wire to `useMutation` in consumer if optimistic UI / loading states needed.
 */
export function liveQuery(body: LiveQueryRequest): Promise<LiveQueryResponse> {
  return apiPost<LiveQueryResponse, LiveQueryRequest>(ENDPOINTS.liveQuery, body)
}
