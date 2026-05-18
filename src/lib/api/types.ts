/**
 * TypeScript types reflecting real POLARIS backend response shapes.
 *
 * Source of truth: `/Users/mac/development/polaris/apps/api/routes/*.py`
 * Shapes derived from FastAPI handlers — narrow as fields are wired in UI.
 * Use `Record<string, unknown>` for nested objects whose shape we don't pin yet.
 */

// ============================================================================
// Politicians
// ============================================================================

export type SentimentLabel =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'mixed'
  | 'sarcastic'

export type Country = 'MX' | 'US'

export interface Politician {
  id: string
  slug: string
  name: string
  party: string | null
  country: Country
  position: string | null
  search_keywords: string[]
  social_handles: Record<string, string>
  photo_url: string | null
  is_active: boolean
  last_collection_at: string | null
  last_aggregation_at: string | null
  created_at?: string
  updated_at?: string
  // Attached by GET /politicians/{id} (live metrics snapshot)
  metrics?: {
    ppi: PPIValue
    sov_24h: SOVValue
  }
}

// ============================================================================
// PPI / SOV / Momentum
// ============================================================================

// Backend `calculate_ppi` returns a structured dict; shape varies, narrow later.
export type PPIValue = Record<string, unknown> | number | null

export type SOVValue = Record<string, unknown> | number | null

export interface PPI {
  politician_id: string
  ppi: PPIValue
  sov_24h: SOVValue
  momentum: Record<string, unknown> | number | null
}

// ============================================================================
// Sentiment breakdown
// ============================================================================

export type SentimentScope = 'all' | 'own' | 'third_party' | 'comments'

export interface SentimentBreakdownCounts {
  positive: number
  negative: number
  neutral: number
  mixed: number
  sarcastic: number
  unprocessed: number
  total: number
  pct: {
    positive: number
    negative: number
    neutral: number
    mixed: number
    sarcastic: number
  }
}

export interface SentimentBreakdown {
  politician_id: string
  scope: SentimentScope
  window_days: number
  breakdown: SentimentBreakdownCounts
}

// ============================================================================
// Top authors
// ============================================================================

export type TopAuthorsScope = 'third_party' | 'comments' | 'all'

export interface TopAuthor {
  author: string
  count: number
  negative: number
  pct_negative: number
  platforms: string[]
}

export interface TopAuthorsResponse {
  politician_id: string
  scope: TopAuthorsScope
  window_days: number
  authors: TopAuthor[]
}

// ============================================================================
// Timeseries
// ============================================================================

export type TimeseriesInterval = 'hour' | 'day' | 'week' | 'month'

export interface TimeseriesBucket {
  timestamp: string
  label: string
  count: number
  avg_sentiment: number | null
  ppi_score: number | null
  sentiment_breakdown?: {
    positive?: number
    negative?: number
    neutral?: number
    mixed?: number
  }
  platform_breakdown?: Record<string, number>
}

export interface Timeseries {
  politician_id: string
  metric: 'mentions'
  interval: TimeseriesInterval
  from: string
  to: string
  buckets: TimeseriesBucket[]
  source: 'precomputed' | 'on_the_fly'
  truncated: boolean
}

// ============================================================================
// Freshness
// ============================================================================

export type FreshnessStatus = 'fresh' | 'stale' | 'missing'

export interface Freshness {
  politician_id: string
  last_collection_at: string | null
  last_aggregation_at: string | null
  hours_since_collection: number | null
  status: FreshnessStatus
}

// ============================================================================
// Topics
// ============================================================================

export interface Topic {
  topic: string
  count: number
  sentiment_avg: number | null
  trend: 'up' | 'down' | 'stable'
}

export interface TopicsResponse {
  politician_id: string
  window_days: number
  topics: Topic[]
  total_unique_topics: number
}

// ============================================================================
// Mentions
// ============================================================================

export type Platform =
  | 'twitter'
  | 'twitter_unofficial'
  | 'bluesky'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'reddit'
  | 'telegram'
  | 'gdelt'
  | 'meta'
  | 'instagram_comment'
  | 'tiktok_comment'
  | 'youtube_comment'
  | 'twitter_reply'
  | 'facebook_comment'
  | (string & {}) // open union — backend may add new platforms

export interface Mention {
  id: string
  politician_id: string
  platform: Platform
  external_id: string
  parent_external_id: string | null
  title: string | null
  content: string
  url: string
  author: string | null
  author_handle: string | null
  sentiment_score: number | null
  sentiment_label: SentimentLabel | null
  engagement_metrics: Record<string, number>
  language: string
  collected_at: string
  published_at: string | null
  topic_categories: string[] | null
  is_own_content: boolean
  is_crisis: boolean | null
  raw_data?: Record<string, unknown>
}

// ============================================================================
// Crisis signals
// ============================================================================

export interface CrisisSignal {
  id: string
  platform: Platform
  author: string | null
  content: string
  published_at: string | null
  sentiment_score: number | null
  topic_categories: string[] | null
  raw_data?: Record<string, unknown>
}

export interface CrisisSignalsResponse {
  politician_id: string
  window_hours: number
  has_active_crisis: boolean
  signal_count: number
  signals: CrisisSignal[]
}

// ============================================================================
// Coordination groups
// ============================================================================

export interface CoordinationGroup {
  id: string
  politician_id: string
  detected_at: string
  is_resolved: boolean
  // Backend persists full row from `coordination_groups`; shape is detector-specific.
  // Narrow once detector schema stabilizes.
  [key: string]: unknown
}

export interface CoordinationGroupsResponse {
  politician_id: string
  groups: CoordinationGroup[]
}

// ============================================================================
// Daily brief
// ============================================================================

export interface DailyBrief {
  id: string
  politician_id: string
  brief_date: string
  // Brief content shape varies (LLM-generated structured output). Narrow later.
  [key: string]: unknown
}

// ============================================================================
// Health
// ============================================================================

export interface Health {
  status: string
  database: string
  anthropic_api_key: string
  gemini_api_key: string
  last_collection_at: string | null
  last_aggregation_at: string | null
  hours_since_collection: number | null
  environment: string
  version: string
}

// ============================================================================
// Live Query (POST /live-query)
// ============================================================================

export interface LiveQueryRequest {
  politician_id: string
  question: string
  context?: Record<string, unknown>
}

export interface LiveQueryResponse {
  answer: string
  sources?: Array<{ id: string; url?: string; title?: string }>
  confidence?: number
  [key: string]: unknown
}
