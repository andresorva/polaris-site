/**
 * TanStack Query hooks for POLARIS API.
 *
 * One hook per backend endpoint. Conventions:
 * - queryKey = [resource, ...identifiers, ...filterParams] so cache
 *   invalidation per politician + per filter combo is trivial.
 * - `enabled: !!id` guards prevent fetches when ids aren't ready (e.g. before
 *   a route param resolves).
 * - Hooks accept optional filter params; defaults mirror backend defaults.
 * - Read endpoints reuse the shared client (apiGet/apiPost). Auth + PATCH go
 *   through authClient (Bearer header + PATCH method) WITHOUT touching the
 *   shared client.ts.
 *
 * REGLA 79: ASCII only in any visible string (none live here; types only).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiGet } from './client'
import {
  apiAuthGet,
  apiAuthPatch,
  apiAuthPost,
  clearToken,
  setToken,
} from './authClient'
import { ENDPOINTS } from './endpoints'
import type {
  Alert,
  CoordinationGroupsResponse,
  CrisisSignalsResponse,
  DailyBrief,
  DailyMetricsResponse,
  Freshness,
  Health,
  Mention,
  PPI,
  Politician,
  SentimentBreakdown,
  SentimentScope,
  Timeseries,
  TimeseriesInterval,
  TopAuthorsScope,
  TopicsResponse,
} from './types'
import type {
  AlertPatchBody,
  AvailableDatesResponse,
  LoginRequest,
  LoginResponse,
  MentionDetail,
  MeResponse,
  TopAuthorsScoredResponse,
  TopicsGroupedResponse,
} from './extended-types'

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
// Metrics (PPI / timeseries / daily / hourly)
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

export function useMetricsDaily(politicianId: string, days = 30) {
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

/** Backwards-compatible alias kept for existing callers. */
export const useDailyMetrics = useMetricsDaily

export function useMetricsHourly(politicianId: string, hours = 24) {
  return useQuery({
    queryKey: ['metrics-hourly', politicianId, hours],
    queryFn: () =>
      apiGet<DailyMetricsResponse>(ENDPOINTS.metricsHourly, {
        politician_id: politicianId,
        hours,
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

/**
 * Top authors. Backend now returns `avg_sentiment_score` per author, so the
 * response is typed as `TopAuthorsScoredResponse` (superset of the legacy
 * `TopAuthorsResponse`). Default window is 90d to mirror the backend default
 * (recurrent low-frequency voices need a wider window to surface).
 */
export function useTopAuthors(politicianId: string, options: TopAuthorsOptions = {}) {
  const { limit = 10, days = 90, scope = 'third_party' } = options
  return useQuery({
    queryKey: ['top-authors', politicianId, limit, days, scope],
    queryFn: () =>
      apiGet<TopAuthorsScoredResponse>(ENDPOINTS.topAuthors(politicianId), {
        limit,
        days,
        scope,
      }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Mentions (+ detail with 9-agent block)
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

/**
 * Detail for one mention -> MentionDetailModal (9 agentes). Returns the flat
 * mention row plus a nested `agents` block (shape CONGELADO en backend).
 */
export function useMentionDetail(mentionId: string | null | undefined) {
  return useQuery({
    queryKey: ['mention', mentionId],
    queryFn: () => apiGet<MentionDetail>(ENDPOINTS.mentionById(mentionId as string)),
    enabled: !!mentionId,
  })
}

// ============================================================================
// Topics (legacy flat list + grouped sunburst)
// ============================================================================

interface TopicsOptions {
  days?: number
}

/** Legacy flat topic list {topic, count, sentiment_avg, trend}. */
export function useTopics(politicianId: string, options: TopicsOptions = {}) {
  const { days = 7 } = options
  return useQuery({
    queryKey: ['topics', politicianId, days],
    queryFn: () => apiGet<TopicsResponse>(ENDPOINTS.topics(politicianId), { days }),
    enabled: !!politicianId,
  })
}

/**
 * Grouped topics for the taxonomy sunburst: rows of
 * {categoria, sub, count, pct_neg, in_taxonomy}. Sends grouped=true.
 */
export function useTopicsGrouped(politicianId: string, options: TopicsOptions = {}) {
  const { days = 90 } = options
  return useQuery({
    queryKey: ['topics-grouped', politicianId, days],
    queryFn: () =>
      apiGet<TopicsGroupedResponse>(ENDPOINTS.topics(politicianId), {
        days,
        grouped: true,
      }),
    enabled: !!politicianId,
  })
}

// ============================================================================
// Freshness
// ============================================================================

export function useFreshness(politicianId: string) {
  return useQuery({
    queryKey: ['freshness', politicianId],
    queryFn: () => apiGet<Freshness>(ENDPOINTS.freshness(politicianId)),
    enabled: !!politicianId,
    // Freshness is most useful when "current" -> refresh more aggressively.
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// Daily brief (+ available dates for the calendar)
// ============================================================================

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

/**
 * Dates that have a generated brief -> lights up the Briefing calendar.
 * API PENDIENTE: endpoint not yet live in backend (Wave 2 exposes it). The
 * builder + hook are wired so the screen flips on with zero changes.
 */
export function useAvailableDates(politicianId: string) {
  return useQuery({
    queryKey: ['daily-brief-available-dates', politicianId],
    queryFn: () =>
      apiGet<AvailableDatesResponse>(
        ENDPOINTS.dailyBriefAvailableDates(politicianId),
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
// Alerts (list + PATCH mutation)
// ============================================================================

export function useAlerts(politicianId: string) {
  return useQuery({
    queryKey: ['alerts', politicianId],
    queryFn: () =>
      apiGet<Alert[]>(ENDPOINTS.alerts, { politician_id: politicianId }),
    enabled: !!politicianId,
  })
}

interface AlertPatchVars {
  id: string
  body: AlertPatchBody
  /** Optional: politicianId to scope cache invalidation. */
  politicianId?: string
}

/**
 * PATCH /alerts/{id} -> Crisis actions (Responder / Escalar / Marcar atendida).
 * On success invalidates the alerts list so the feed + sidebar badge refresh.
 */
export function useAlertPatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: AlertPatchVars) =>
      apiAuthPatch<Alert, AlertPatchBody>(ENDPOINTS.alertById(id), body),
    onSuccess: (_data, vars) => {
      if (vars.politicianId) {
        qc.invalidateQueries({ queryKey: ['alerts', vars.politicianId] })
      } else {
        qc.invalidateQueries({ queryKey: ['alerts'] })
      }
    },
  })
}

// ============================================================================
// Auth (login / me / logout)
// ============================================================================

/**
 * POST /auth/login -> stores the access token (for the Bearer header) and
 * returns the login payload. Token persistence lives in authClient.
 */
export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (creds: LoginRequest) =>
      // Login itself does not need a prior token.
      apiAuthPost<LoginResponse, LoginRequest>(ENDPOINTS.authLogin, creds, undefined, false),
    onSuccess: (data) => {
      if (data?.access_token) setToken(data.access_token)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

/**
 * GET /auth/me -> the user behind the current Bearer token. `enabled` defaults
 * to true; pass `false` to skip (e.g. on the login screen before a token
 * exists). 401/expired -> ApiError, which the consumer can treat as logged-out.
 */
export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiAuthGet<MeResponse>(ENDPOINTS.authMe),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * POST /logout -> clears the local token then notifies the backend
 * (idempotent server-side). Resets the cached `auth/me`.
 */
export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await apiAuthPost<{ ok: boolean; message: string }, Record<string, never>>(
          ENDPOINTS.authLogout,
          {},
        )
      } finally {
        // Always drop the local token even if the network call fails.
        clearToken()
      }
    },
    onSuccess: () => {
      qc.setQueryData(['auth', 'me'], undefined)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
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
