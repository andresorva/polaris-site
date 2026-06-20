/**
 * Extended POLARIS types for the NEW Wave 2 endpoints + fields not yet in the
 * shared `types.ts`. Kept in a separate module so we never edit the shared
 * `types.ts` (consumed across the app by other waves).
 *
 * Source of truth verified against backend routes:
 *   apps/api/routes/auth.py        (login / me / logout)
 *   apps/api/routes/alerts.py      (PATCH /alerts/{id})
 *   apps/api/routes/mentions.py    (GET /mentions/{id} — 9 agentes)
 *   apps/api/routes/politicians.py (topics grouped, top-authors avg score)
 *
 * REGLA 79: ASCII only in any visible string (none live here; types only).
 */

import type {
  Mention,
  SentimentLabel,
  TopAuthor,
} from './types'

// ============================================================================
// Auth (POST /auth/login, GET /auth/me, POST /logout)
// ============================================================================

export interface AuthUser {
  username: string
  roles: string[]
  politician_id: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string // "bearer"
  expires_in: number // seconds
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
}

export interface LogoutResponse {
  ok: boolean
  message: string
}

// ============================================================================
// Topics — grouped mode (GET /:id/topics?grouped=true) for the sunburst
// ============================================================================

/** One (categoria, sub) cell for the taxonomy sunburst. */
export interface TopicGroupRow {
  categoria: string
  sub: string | null
  count: number
  pct_neg: number
  in_taxonomy: boolean
}

export interface TopicsGroupedResponse {
  politician_id: string
  window_days: number
  grouped: true
  rows: TopicGroupRow[]
  total_groups: number
}

// ============================================================================
// Top authors — backend now returns avg_sentiment_score per author.
// The shared TopAuthor type predates this field; extend it here.
// ============================================================================

export interface TopAuthorWithScore extends TopAuthor {
  avg_sentiment_score: number | null
}

export interface TopAuthorsScoredResponse {
  politician_id: string
  scope: string
  window_days: number
  authors: TopAuthorWithScore[]
}

// ============================================================================
// Mention detail — GET /mentions/{id} (modal Fuentes, 9 agentes). Shape
// CONGELADO en backend. The response is the flat mention row PLUS an `agents`
// block.
// ============================================================================

export interface MentionAgents {
  // sentiment_mx
  sentiment_label: SentimentLabel | null
  sentiment_score: number | null
  // entity_extractor
  entities: Record<string, unknown>
  // topic_classifier
  topic_categories: string[]
  // structurer
  content_type: string | null
  // crisis_detector
  is_crisis: boolean
  // orchestrator metadata
  processed_by_agents: Record<string, unknown>
  agent_versions: Record<string, unknown>
  pending_review: boolean
  processed_at: string | null
  // granular fields (null until backend migs 015-016 land)
  emotional_intensity: number | null
  is_sarcastic: boolean | null
  is_attack: boolean | null
  cultural_context: string | null
  confidence: number | null
}

/** Full mention row + nested agents block. */
export type MentionDetail = Mention & {
  agents: MentionAgents
}

// ============================================================================
// Daily brief available dates (GET /:id/daily-brief/available-dates)
// API PENDIENTE: endpoint not yet live in backend. Shape assumed per handoff
// (a list of YYYY-MM-DD strings the calendar can light up).
// ============================================================================

export interface AvailableDatesResponse {
  politician_id: string
  dates: string[] // YYYY-MM-DD
}

// ============================================================================
// Alert PATCH (PATCH /alerts/{id}) — Crisis actions
// ============================================================================

export type AlertEstado = 'nueva' | 'atendida' | 'escalada'

/** Body for PATCH /alerts/{id}. All fields optional (partial patch). */
export interface AlertPatchBody {
  estado?: AlertEstado
  is_resolved?: boolean
  note?: string
}
