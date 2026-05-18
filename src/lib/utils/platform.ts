/**
 * Platform metadata — display labels + Tailwind class triples.
 *
 * Backend returns snake_case platform strings (open union). Frontend renders
 * these through `PlatformChip` (badge) and dropdowns/buttons (text-only).
 *
 * Lives under `lib/utils/` rather than alongside the chip so react-refresh
 * can stay happy with files that only export components.
 */

export type PlatformStyle = {
  label: string
  bg: string
  text: string
  border: string
}

export const PLATFORM_STYLES: Record<string, PlatformStyle> = {
  twitter: {
    label: 'Twitter',
    bg: 'bg-sky-500/15',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/30',
  },
  twitter_unofficial: {
    label: 'Twitter*',
    bg: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/30',
  },
  twitter_reply: {
    label: 'Twitter reply',
    bg: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/30',
  },
  bluesky: {
    label: 'Bluesky',
    bg: 'bg-blue-400/15',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-400/30',
  },
  facebook: {
    label: 'Facebook',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
  },
  facebook_comment: {
    label: 'FB comment',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
  },
  meta: {
    label: 'Meta',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
  },
  instagram: {
    label: 'Instagram',
    bg: 'bg-pink-500/15',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-500/30',
  },
  instagram_comment: {
    label: 'IG comment',
    bg: 'bg-pink-500/10',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-500/30',
  },
  tiktok: {
    label: 'TikTok',
    bg: 'bg-neutral-900/15 dark:bg-neutral-100/10',
    text: 'text-neutral-900 dark:text-neutral-100',
    border: 'border-neutral-500/40',
  },
  tiktok_comment: {
    label: 'TikTok comment',
    bg: 'bg-neutral-900/10 dark:bg-neutral-100/10',
    text: 'text-neutral-900 dark:text-neutral-100',
    border: 'border-neutral-500/40',
  },
  youtube: {
    label: 'YouTube',
    bg: 'bg-red-500/15',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500/30',
  },
  youtube_comment: {
    label: 'YT comment',
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500/30',
  },
  reddit: {
    label: 'Reddit',
    bg: 'bg-orange-500/15',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/30',
  },
  telegram: {
    label: 'Telegram',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/30',
  },
  gdelt: {
    label: 'GDELT',
    bg: 'bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
  },
  news_mx: {
    label: 'News MX',
    bg: 'bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/30',
  },
  news: {
    label: 'News',
    bg: 'bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/30',
  },
  google_trends: {
    label: 'Google Trends',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-500/30',
  },
}

export const PLATFORM_FALLBACK_STYLE: PlatformStyle = {
  label: '',
  bg: 'bg-surface-elevated',
  text: 'text-ink',
  border: 'border-border',
}

export function platformLabel(platform: string): string {
  return PLATFORM_STYLES[platform]?.label ?? platform
}

export function platformStyle(platform: string): PlatformStyle {
  return PLATFORM_STYLES[platform] ?? PLATFORM_FALLBACK_STYLE
}
