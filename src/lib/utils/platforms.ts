/**
 * Platform metadata for design-v3 — ASCII label + lucide icon component.
 *
 * Backend returns snake_case platform strings as an OPEN union (it can add new
 * platforms at any time), so every lookup falls back gracefully.
 *
 * REGLA 79: all labels are ASCII (a e i o u n, no accents / n-with-tilde).
 *
 * NOTE: this is a NEW module distinct from the legacy `platform.ts` (which
 * carries Tailwind class triples for the old `PlatformChip`). This one pairs a
 * clean label with a lucide icon component for the v3 surfaces. lucide-react
 * v1 dropped brand glyphs (Twitter/Facebook/...), so we map to neutral generic
 * icons that are guaranteed to exist.
 */

import {
  AtSign,
  Cloud,
  Globe,
  HelpCircle,
  Image,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  PlaySquare,
  Rss,
  Send,
  TrendingUp,
  Video,
  type LucideIcon,
} from 'lucide-react'

export interface PlatformMeta {
  /** ASCII display label (REGLA 79 compliant). */
  label: string
  /** lucide icon component. Render as `<meta.icon className="..." />`. */
  icon: LucideIcon
  /** Stable color token name (CSS var) for tinting, theme-driven. */
  colorVar: string
}

/**
 * platform string -> meta. Keys mirror `Platform` in `../api/types`, plus the
 * comment / reply variants the backend emits.
 */
export const PLATFORM_META: Record<string, PlatformMeta> = {
  twitter: { label: 'Twitter', icon: AtSign, colorVar: 'var(--platform-twitter, #1d9bf0)' },
  twitter_unofficial: { label: 'Twitter', icon: AtSign, colorVar: 'var(--platform-twitter, #1d9bf0)' },
  twitter_reply: { label: 'Twitter reply', icon: MessageCircle, colorVar: 'var(--platform-twitter, #1d9bf0)' },

  bluesky: { label: 'Bluesky', icon: Cloud, colorVar: 'var(--platform-bluesky, #1185fe)' },

  facebook: { label: 'Facebook', icon: MessageSquare, colorVar: 'var(--platform-facebook, #1877f2)' },
  facebook_comment: { label: 'FB comment', icon: MessageCircle, colorVar: 'var(--platform-facebook, #1877f2)' },

  meta: { label: 'Meta', icon: MessageSquare, colorVar: 'var(--platform-meta, #0668e1)' },

  instagram: { label: 'Instagram', icon: Image, colorVar: 'var(--platform-instagram, #e1306c)' },
  instagram_comment: { label: 'IG comment', icon: MessageCircle, colorVar: 'var(--platform-instagram, #e1306c)' },

  tiktok: { label: 'TikTok', icon: Video, colorVar: 'var(--platform-tiktok, #010101)' },
  tiktok_comment: { label: 'TikTok comment', icon: MessageCircle, colorVar: 'var(--platform-tiktok, #010101)' },

  youtube: { label: 'YouTube', icon: PlaySquare, colorVar: 'var(--platform-youtube, #ff0000)' },
  youtube_comment: { label: 'YT comment', icon: MessageCircle, colorVar: 'var(--platform-youtube, #ff0000)' },

  reddit: { label: 'Reddit', icon: MessagesSquare, colorVar: 'var(--platform-reddit, #ff4500)' },

  telegram: { label: 'Telegram', icon: Send, colorVar: 'var(--platform-telegram, #2aabee)' },

  gdelt: { label: 'GDELT', icon: Globe, colorVar: 'var(--platform-gdelt, #f59e0b)' },

  news_mx: { label: 'Noticias MX', icon: Newspaper, colorVar: 'var(--platform-news, #64748b)' },
  news: { label: 'Noticias', icon: Newspaper, colorVar: 'var(--platform-news, #64748b)' },

  google_trends: { label: 'Google Trends', icon: TrendingUp, colorVar: 'var(--platform-trends, #eab308)' },

  rss: { label: 'RSS', icon: Rss, colorVar: 'var(--platform-rss, #ee802f)' },
}

/** Fallback for unknown platforms (open union). */
export const PLATFORM_FALLBACK: PlatformMeta = {
  label: 'Otro',
  icon: HelpCircle,
  colorVar: 'var(--platform-unknown, var(--text-2, #888))',
}

/** Full meta for a platform string, never null. */
export function platformMeta(platform: string | null | undefined): PlatformMeta {
  if (!platform) return PLATFORM_FALLBACK
  return PLATFORM_META[platform] ?? PLATFORM_FALLBACK
}

/** ASCII label for a platform string. Falls back to a tidied raw value. */
export function platformLabel(platform: string | null | undefined): string {
  if (!platform) return PLATFORM_FALLBACK.label
  const known = PLATFORM_META[platform]
  if (known) return known.label
  // Unknown: tidy snake_case -> "Title Case" so it is at least readable.
  return platform
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** lucide icon component for a platform string. */
export function platformIcon(platform: string | null | undefined): LucideIcon {
  return platformMeta(platform).icon
}

/** CSS color var for a platform string. */
export function platformColorVar(platform: string | null | undefined): string {
  return platformMeta(platform).colorVar
}

// Re-export for screens that want to iterate / build filters.
export const KNOWN_PLATFORMS: string[] = Object.keys(PLATFORM_META)
