/**
 * Server-Sent Events (SSE) over HTTP POST.
 *
 * Why a custom parser instead of `EventSource`:
 *   - `EventSource` is GET-only — POLARIS `/api/v1/live-query` is POST with a
 *     JSON body (query + filters).
 *   - We parse the `text/event-stream` format ourselves from `fetch().body`
 *     (a `ReadableStream<Uint8Array>`).
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
      res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
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
