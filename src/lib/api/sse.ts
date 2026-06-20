/**
 * Server-Sent Events (SSE) over HTTP POST.
 *
 * Why a custom parser instead of `EventSource`:
 *   - `EventSource` is GET-only — POLARIS `/api/v1/live-query` is POST with a
 *     JSON body. New contract body shape: `{ query }` (renamed from
 *     `question`) plus optional `platforms` / `time_range` filters — see
 *     `PulsoLiveQueryRequest`.
 *   - We parse the `text/event-stream` format ourselves from `fetch().body`
 *     (a `ReadableStream<Uint8Array>`).
 *
 * Pulso `mention` events:
 *   The backend emits `event: mention` with a compact payload
 *   `{ plat, author, text, score, sent, eng, timestamp, url }`. Use
 *   `normalizePulsoMention()` to map that wire shape to the canonical
 *   `Mention` type the UI renders. `streamPost` stays generic — it just hands
 *   the parsed `data` to `onEvent`; callers decide whether to normalize.
 *
 * Auth:
 *   `streamPost` attaches `Authorization: Bearer <token>` when a session token
 *   is present in storage (// API PENDIENTE auth real). Anonymous otherwise.
 *
 * SSE format reminder (per WHATWG):
 *   event: foo\n
 *   data: {"x":1}\n
 *   id: 42\n
 *   retry: 3000\n
 *   \n        <-- blank line terminates the event
 *
 * Multi-line `data:` fields are concatenated with `\n`. Lines starting with `:`
 * are comments and ignored. Unknown field names are ignored.
 *
 * The parser:
 *   - Reads chunks from the response stream.
 *   - Decodes UTF-8 incrementally (TextDecoder with `stream: true` so multi-byte
 *     codepoints split across chunks don't corrupt).
 *   - Buffers until it sees `\n\n` (event delimiter). Each event is parsed and
 *     handed to `handlers.onEvent`.
 *   - JSON-parses the `data` field. If parsing fails, the raw string is
 *     emitted instead (caller decides how to handle).
 *
 * Cancellation:
 *   - Caller passes an `AbortSignal`. When aborted, fetch rejects with
 *     `AbortError` — we catch that and resolve quietly (no onError invoked).
 *   - On other errors (non-2xx response, network), `handlers.onError` is
 *     invoked and the promise still resolves (we do NOT throw — caller can use
 *     handlers for control flow).
 *   - `handlers.onClose` always fires once when the stream ends (success or
 *     error or abort).
 */

import { getAuthToken } from './client'
import type { Mention, Platform, SentimentLabel } from './types'

export type SseEvent = {
  event: string
  data: unknown
  id?: string
  retry?: number
}

export type SseHandlers = {
  onEvent?: (e: SseEvent) => void
  onError?: (err: unknown) => void
  onClose?: () => void
}

const DEFAULT_EVENT_NAME = 'message'

// ============================================================================
// Pulso live-query contract (POST /api/v1/live-query)
// ============================================================================

/**
 * Request body for the Pulso live-query stream.
 *
 * Contract change: the field is now `query` (was `question`). `platforms` and
 * `time_range` are optional server-side filters. Kept open (`[key: string]`)
 * so callers can pass extra context without a type bump.
 */
export interface PulsoLiveQueryRequest {
  query: string
  politician_id?: string
  platforms?: string[]
  time_range?: string
  [key: string]: unknown
}

/**
 * Wire shape of a single `mention` SSE event from the backend.
 *
 * The backend emits a compact shape per the design-v3 Pulso spec:
 *   { plat, author, text, score, sent, eng, timestamp, url }
 * where:
 *   - `plat`      platform slug (twitter | bluesky | youtube | news | ...)
 *   - `author`    handle/name string
 *   - `text`      mention body
 *   - `score`     sentiment score in [-1, 1]
 *   - `sent`      short label: 'pos' | 'neg' | 'neu' | 'mix' | 'sar'
 *   - `eng`       [likes/reactions, reposts/shares, comments] tuple
 *   - `timestamp` ISO string (publication / collection time)
 *   - `url`       source URL
 * All fields are optional on the wire — the backend may omit any of them, and
 * `normalizePulsoMention` fills sane fallbacks.
 */
export interface PulsoMentionWire {
  plat?: string
  author?: string | null
  text?: string
  score?: number | null
  sent?: string | null
  eng?: number[] | null
  timestamp?: string | null
  url?: string | null
  // The backend may also attach an explicit id; if not we synthesize one.
  id?: string
}

const SHORT_SENT_TO_LABEL: Record<string, SentimentLabel> = {
  pos: 'positive',
  positive: 'positive',
  neg: 'negative',
  negative: 'negative',
  neu: 'neutral',
  neutral: 'neutral',
  mix: 'mixed',
  mixed: 'mixed',
  sar: 'sarcastic',
  sarcastic: 'sarcastic',
}

/**
 * Maps the short `sent` wire code (`'neg'`, `'pos'`, ...) to the canonical
 * `SentimentLabel`. Returns null for unknown/absent codes.
 */
export function shortSentToLabel(
  sent: string | null | undefined,
): SentimentLabel | null {
  if (!sent) return null
  return SHORT_SENT_TO_LABEL[sent.toLowerCase()] ?? null
}

/**
 * Type guard: does this value look like a Pulso wire mention (new contract)?
 * Recognized by the presence of any of the compact fields. Used to disambiguate
 * from the already-normalized `Mention` shape (which uses `platform`/`content`).
 */
export function isPulsoMentionWire(value: unknown): value is PulsoMentionWire {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    'plat' in v ||
    'text' in v ||
    'sent' in v ||
    'eng' in v
  )
}

let pulsoMentionSeq = 0

/**
 * Normalizes a `PulsoMentionWire` into the canonical `Mention` type the UI
 * already renders. This keeps the SSE wire contract decoupled from the rich
 * `Mention` shape used everywhere else, so consumers (e.g. the Pulso page) can
 * push the result straight into their existing mention list.
 *
 * Notes:
 *   - `id`: uses the backend id when present, else synthesizes a stable-enough
 *     id from url+timestamp (falls back to a monotonic counter) so the consumer
 *     dedupe-by-id logic keeps working.
 *   - `engagement_metrics`: maps the `eng` tuple to a labeled record.
 *   - `politician_id`: optional context the caller may inject afterward; left as
 *     '' here since the wire event does not carry it.
 */
export function normalizePulsoMention(
  wire: PulsoMentionWire,
  ctx?: { politicianId?: string },
): Mention {
  const eng = Array.isArray(wire.eng) ? wire.eng : []
  const [likes, reposts, comments] = eng
  const engagement_metrics: Record<string, number> = {}
  if (typeof likes === 'number') engagement_metrics.likes = likes
  if (typeof reposts === 'number') engagement_metrics.reposts = reposts
  if (typeof comments === 'number') engagement_metrics.comments = comments

  const timestamp =
    typeof wire.timestamp === 'string' && wire.timestamp.length > 0
      ? wire.timestamp
      : new Date().toISOString()

  const id =
    typeof wire.id === 'string' && wire.id.length > 0
      ? wire.id
      : `pulso_${wire.url ?? ''}_${timestamp}_${++pulsoMentionSeq}`

  return {
    id,
    politician_id: ctx?.politicianId ?? '',
    platform: (wire.plat ?? 'unknown') as Platform,
    external_id: id,
    parent_external_id: null,
    title: null,
    content: typeof wire.text === 'string' ? wire.text : '',
    url: typeof wire.url === 'string' ? wire.url : '',
    author: wire.author ?? null,
    author_handle: wire.author ?? null,
    sentiment_score: typeof wire.score === 'number' ? wire.score : null,
    sentiment_label: shortSentToLabel(wire.sent),
    engagement_metrics,
    language: 'es',
    collected_at: timestamp,
    published_at: timestamp,
    topic_categories: null,
    is_own_content: false,
    is_crisis: null,
  }
}

/**
 * Parse one fully-buffered SSE event block (the text between two `\n\n`).
 * Returns null for blocks that contain only comments or no `data` field
 * (which the spec says should be skipped).
 */
function parseEventBlock(block: string): SseEvent | null {
  let eventName = DEFAULT_EVENT_NAME
  const dataLines: string[] = []
  let id: string | undefined
  let retry: number | undefined

  for (const rawLine of block.split('\n')) {
    // Strip a trailing CR (parsers should handle CRLF gracefully).
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    if (line.length === 0) continue
    if (line.startsWith(':')) continue // SSE comment

    // Field: optionally followed by ": value". If no colon, the whole line is
    // the field name and the value is the empty string.
    const colonIdx = line.indexOf(':')
    let field: string
    let value: string
    if (colonIdx === -1) {
      field = line
      value = ''
    } else {
      field = line.slice(0, colonIdx)
      value = line.slice(colonIdx + 1)
      // Per spec: strip a single leading space if present.
      if (value.startsWith(' ')) value = value.slice(1)
    }

    switch (field) {
      case 'event':
        eventName = value || DEFAULT_EVENT_NAME
        break
      case 'data':
        dataLines.push(value)
        break
      case 'id':
        // Per spec, null bytes invalidate the id; we just keep the string.
        id = value
        break
      case 'retry': {
        const n = Number(value)
        if (Number.isFinite(n) && n >= 0) retry = n
        break
      }
      default:
        // Unknown fields ignored.
        break
    }
  }

  if (dataLines.length === 0) return null
  const rawData = dataLines.join('\n')
  let data: unknown
  try {
    data = JSON.parse(rawData)
  } catch {
    // Fall back to the raw string — caller can still see it.
    data = rawData
  }
  return { event: eventName, data, id, retry }
}

export async function streamPost(
  url: string,
  body: unknown,
  handlers: SseHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let aborted = false
  const onAbort = () => {
    aborted = true
  }
  if (signal) {
    if (signal.aborted) aborted = true
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    let res: Response
    try {
      // // API PENDIENTE auth real — attach Bearer when a session token exists.
      const token = getAuthToken()
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      }
      if (token) headers.Authorization = `Bearer ${token}`
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      })
    } catch (err) {
      if (aborted || (err instanceof Error && err.name === 'AbortError')) {
        return
      }
      handlers.onError?.(err)
      return
    }

    if (!res.ok) {
      // Drain body for diagnostics so the user gets context in onError.
      let detail: unknown
      try {
        detail = await res.text()
      } catch {
        detail = undefined
      }
      handlers.onError?.({
        status: res.status,
        statusText: res.statusText,
        detail,
      })
      return
    }

    const stream = res.body
    if (!stream) {
      handlers.onError?.(new Error('Response has no body to stream'))
      return
    }

    const reader = stream.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
      // Read until EOF or abort.
      // We do NOT trust signal alone — also guard with `aborted` flag so we can
      // bail out promptly between chunks.
      while (true) {
        if (aborted) break
        const { value, done } = await reader.read()
        if (done) {
          // Flush any pending buffered event when stream ends cleanly.
          buffer += decoder.decode()
          const flushed = buffer.trim()
          if (flushed.length > 0) {
            const parsed = parseEventBlock(flushed)
            if (parsed) handlers.onEvent?.(parsed)
          }
          buffer = ''
          break
        }
        buffer += decoder.decode(value, { stream: true })

        // Drain any complete events. SSE separates events with a blank line,
        // which manifests as `\n\n` (or `\r\n\r\n`). We normalize CRLF→LF
        // before splitting so both work.
        // Search for the delimiter in a loop so a single chunk that contains
        // many events gets all of them dispatched.
        let delim: number
        while ((delim = findEventDelimiter(buffer)) !== -1) {
          const block = buffer.slice(0, delim)
          // Skip past the delimiter (`\n\n` = 2 chars, `\r\n\r\n` = 4).
          const skip = buffer.startsWith('\r\n\r\n', delim)
            ? 4
            : buffer.startsWith('\n\n', delim)
              ? 2
              : 2
          buffer = buffer.slice(delim + skip)
          if (block.length === 0) continue
          const parsed = parseEventBlock(block)
          if (parsed) handlers.onEvent?.(parsed)
        }
      }
    } catch (err) {
      if (aborted || (err instanceof Error && err.name === 'AbortError')) {
        return
      }
      handlers.onError?.(err)
    } finally {
      try {
        await reader.cancel()
      } catch {
        // Best-effort cleanup — ignore.
      }
    }
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort)
    handlers.onClose?.()
  }
}

/**
 * Returns the index of the start of the next event delimiter in `buffer`,
 * or -1 if none found. Handles both `\n\n` and `\r\n\r\n`.
 */
function findEventDelimiter(buffer: string): number {
  // Prefer the earliest match — but since both forms end at the same logical
  // event boundary, just return whichever comes first.
  const lf = buffer.indexOf('\n\n')
  const crlf = buffer.indexOf('\r\n\r\n')
  if (lf === -1) return crlf
  if (crlf === -1) return lf
  return Math.min(lf, crlf)
}
