/**
 * REGLA 79 — accent + n-with-tilde scrubber.
 *
 * Every UI string WE control (chrome, labels, titles, tooltips, formatted
 * dates) must render ASCII-only: a e i o u n, never the accented variants.
 *
 * Use this to sanitize ANY dynamic string before it reaches the DOM: author
 * names, topic labels, location names, backend-provided category strings, etc.
 *
 * NOTE: free-form narrative copy that the backend generates intentionally
 * (executive_summary, full_markdown) is rendered as-is elsewhere — that is the
 * model's job, not this helper's. This is for the chrome we own.
 */

// Combining diacritical marks block (U+0300..U+036F). Removing these after an
// NFD decomposition turns "á" -> "a", "ñ" -> "n", "ü" -> "u", etc.
const COMBINING_MARKS = /[̀-ͯ]/g

// A few precomposed glyphs that do NOT decompose cleanly via NFD and must be
// mapped explicitly to stay ASCII.
const EXTRA_MAP: Record<string, string> = {
  'ß': 'ss',
  'æ': 'ae',
  'Æ': 'AE',
  'œ': 'oe',
  'Œ': 'OE',
  'ø': 'o',
  'Ø': 'O',
  'ł': 'l',
  'Ł': 'L',
  'đ': 'd',
  'Đ': 'D',
}

const EXTRA_RE = new RegExp(`[${Object.keys(EXTRA_MAP).join('')}]`, 'g')

/**
 * Remove accents and n-with-tilde from a string, returning ASCII letters.
 *
 * "Sarcástico" -> "Sarcastico"
 * "Información"  -> "Informacion"
 * "Niños"       -> "Ninos"
 *
 * Null / undefined collapse to an empty string so callers can interpolate
 * without guarding.
 */
export function stripAccents(input: string | null | undefined): string {
  if (input === null || input === undefined) return ''
  return input
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(EXTRA_RE, (ch) => EXTRA_MAP[ch] ?? ch)
}

/**
 * True when the string is already ASCII-only post-strip (no work needed).
 * Handy for dev-time assertions / tests guarding REGLA 79.
 */
export function isAscii(input: string | null | undefined): boolean {
  if (input === null || input === undefined) return true
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(input)
}

export default stripAccents
