/**
 * Canonical backend endpoint paths (URL builders).
 *
 * Source of truth verified via live curl + backend routers at
 *   /Users/mac/development/polaris/apps/api/routes/*.py
 * against https://web-production-d6505.up.railway.app
 *
 * Mount points (apps/api/main.py):
 *   - politicians.router  -> prefix /api/v1            (paths "" , "/{id}", "/{id}/...")
 *   - mentions.router     -> prefix /api/v1            (paths "/mentions", "/mentions/{id}")
 *   - metrics.router      -> prefix /api/v1 + "/metrics" => /api/v1/metrics/*
 *   - alerts.router       -> prefix /api/v1 + "/alerts"  => /api/v1/alerts*
 *   - live_query.router   -> prefix /api/v1            (path "/live-query")
 *   - admin.router        -> prefix /api/v1            (paths "/admin/*")
 *   - auth.router         -> prefix /api/v1            (paths "/auth/*", "/logout")
 *
 * Metrics endpoints live under `/api/v1/metrics/*` (NOT under
 * `/politicians/{id}/metrics/*`):
 *   - `ppi/{id}` uses path param.
 *   - `timeseries` / `daily` / `hourly` use query param `politician_id=`.
 *
 * REGLA 79: cero acentos en strings; todos los paths son ASCII por naturaleza.
 *
 * Convencion params: cada builder con query params expone un tipo `*Params`
 * tipado para que `apiGet`/`apiPost` reciban un `Record` ya validado por TS.
 * Los `// API PENDIENTE` marcan endpoints que Wave 2 aun deja como stub o que
 * dependen de columnas/tablas que Wave 1 todavia esta migrando.
 */

import type {
  SentimentScope,
  TimeseriesInterval,
  TopAuthorsScope,
} from './types'

// ============================================================================
// Query param shapes (tipados; todos opcionales salvo nota)
// ============================================================================

export interface SentimentBreakdownParams {
  scope?: SentimentScope
  days?: number
}

export interface TopAuthorsParams {
  /** Numero de autores a devolver. Backend default 10. */
  limit?: number
  days?: number
  scope?: TopAuthorsScope
  // NOTA Wave 2: la respuesta ahora incluye `avg_sentiment_score` por autor.
  // El cambio es de SHAPE de respuesta (ver types.ts TopAuthor), no de params.
}

export interface TimeseriesParams {
  /** REQUERIDO por el backend (query param). */
  politician_id: string
  interval?: TimeseriesInterval
  days?: number
  since?: string
  until?: string
}

export interface MetricsDailyParams {
  /** REQUERIDO por el backend (query param). */
  politician_id: string
  days?: number
}

export interface MetricsHourlyParams {
  /** REQUERIDO por el backend (query param). */
  politician_id: string
  /** Ventana en horas. Backend default 24, max 720 (30 dias). */
  hours?: number
}

export interface TopicsParams {
  days?: number
  /**
   * grouped=true -> filas {categoria, sub, count, pct_neg} para el sunburst
   * (anillo interno=categoria, externo=sub). grouped=false -> lista plana
   * legacy {topic, count, sentiment_avg, trend}.
   */
  grouped?: boolean
}

export interface CrisisSignalsParams {
  /** Ventana en horas. Backend default 24. */
  hours?: number
}

export interface CoordinationGroupsParams {
  active_only?: boolean
  limit?: number
}

export interface DailyBriefParams {
  /** YYYY-MM-DD; ausente => hoy (UTC). */
  date?: string
}

export interface MentionsListParams {
  politician_id?: string
  platform?: string
  is_own_content?: boolean
  /** true = solo comentarios; false = solo no-comentarios. */
  has_parent?: boolean
  /** Drill-down: comentarios de un post/video especifico. */
  parent_external_id?: string
  /** Backend default 50, rango 1..500. */
  limit?: number
  offset?: number
}

export interface AlertsListParams {
  politician_id?: string
  /** Backend default true (solo no resueltas). */
  active_only?: boolean
}

/** Body de PATCH /alerts/{id}. Todos opcionales; al menos uno requerido. */
export interface AlertPatchBody {
  /** nueva | atendida | escalada */
  estado?: 'nueva' | 'atendida' | 'escalada'
  is_resolved?: boolean
  /** Nota de seguimiento (max 2000, sin acentos por REGLA 79). */
  note?: string
}

export interface LiveQueryBody {
  politician_id: string
  question: string
  context?: Record<string, unknown>
}

/** Body de POST /auth/login. Usa username (no email) por el form actual. */
export interface LoginBody {
  username: string
  password: string
}

// ============================================================================
// Endpoint builders
// ============================================================================

export const ENDPOINTS = {
  // --- Health ---------------------------------------------------------------
  health: '/health',

  // --- Politicians ----------------------------------------------------------
  politicians: '/api/v1/politicians',
  politicianById: (id: string) => `/api/v1/politicians/${id}`,
  sentimentBreakdown: (id: string) =>
    `/api/v1/politicians/${id}/sentiment-breakdown`,
  // Wave 2: respuesta incluye avg_sentiment_score por autor (shape, no path).
  topAuthors: (id: string) => `/api/v1/politicians/${id}/top-authors`,
  freshness: (id: string) => `/api/v1/politicians/${id}/freshness`,
  // grouped=true => filas {categoria, sub, count, pct_neg} para el sunburst.
  topics: (id: string) => `/api/v1/politicians/${id}/topics`,
  crisisSignals: (id: string) => `/api/v1/politicians/${id}/crisis-signals`,
  coordinationGroups: (id: string) =>
    `/api/v1/politicians/${id}/coordination-groups`,
  dailyBrief: (id: string) => `/api/v1/politicians/${id}/daily-brief`,
  // API PENDIENTE Wave 2: GET /politicians/{id}/daily-brief/available-dates
  //   devuelve las fechas con brief generado (para el date picker del Briefing
  //   Diario). El builder ya esta listo; el backend lo expone en Wave 2.
  dailyBriefAvailableDates: (id: string) =>
    `/api/v1/politicians/${id}/daily-brief/available-dates`,

  // --- Metrics (todos bajo /api/v1/metrics/*) -------------------------------
  ppi: (id: string) => `/api/v1/metrics/ppi/${id}`,
  timeseries: '/api/v1/metrics/timeseries',
  metricsDaily: '/api/v1/metrics/daily',
  metricsHourly: '/api/v1/metrics/hourly',

  // --- Mentions -------------------------------------------------------------
  mentions: '/api/v1/mentions',
  // Wave 2: detalle de 9 agentes (row plano + bloque `agents`). Shape congelado.
  mentionById: (id: string) => `/api/v1/mentions/${id}`,

  // --- Alerts ---------------------------------------------------------------
  alerts: '/api/v1/alerts',
  // PATCH: acciones Responder / Escalar / Marcar atendida (body AlertPatchBody).
  alertById: (id: string) => `/api/v1/alerts/${id}`,

  // --- Live Query (POST) ----------------------------------------------------
  liveQuery: '/api/v1/live-query',

  // --- Auth (Wave 2) --------------------------------------------------------
  // POST /auth/login (body LoginBody) -> { access_token, token_type, expires_in, user }
  authLogin: '/api/v1/auth/login',
  // GET /auth/me  (header Authorization: Bearer <token>) -> { user }
  authMe: '/api/v1/auth/me',
  // POST /logout (header Authorization opcional; idempotente) -> { ok, message }
  authLogout: '/api/v1/logout',

  // --- Admin (protegido por header X-Admin-Secret; lo agrega el caller) ------
  // API PENDIENTE: superficie admin solo para herramientas internas; el front
  // de demo no la usa, pero dejamos los builders tipados por completitud.
  adminRunDaily: '/api/v1/admin/run-daily',
  adminJobs: '/api/v1/admin/jobs',
  adminJobStatus: (jobId: string) => `/api/v1/admin/job-status/${jobId}`,
  adminGenerateBrief: '/api/v1/admin/generate-brief',
} as const
