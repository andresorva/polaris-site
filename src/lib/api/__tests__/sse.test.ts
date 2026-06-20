/**
 * Tests for `streamPost` SSE parser.
 *
 * Strategy: mock global `fetch` to return a `Response` whose body is a
 * `ReadableStream` we control. We push raw `text/event-stream` chunks and
 * verify the parser dispatches the expected event blocks.
 *
 * Edge cases under test:
 *   - Single event in one chunk
 *   - Multiple events in one chunk
 *   - One event split across chunks (boundary inside a `data:` line)
 *   - Multi-line `data:` concatenated with `\n`
 *   - `event:` defaults to `message` when omitted
 *   - Comment lines (`:`) are skipped
 *   - CRLF line endings
 *   - Non-2xx response invokes `onError`
 *   - Abort mid-stream resolves without onError
 *   - `onClose` always fires
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isPulsoMentionWire,
  normalizePulsoMention,
  shortSentToLabel,
  streamPost,
  type PulsoMentionWire,
  type SseEvent,
} from '../sse'
import { AUTH_TOKEN_KEY } from '../client'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function streamResponse(
  chunks: string[],
  init: { status?: number; statusText?: string } = {},
): Response {
  const encoder = new TextEncoder()
  let i = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]))
        i++
      } else {
        controller.close()
      }
    },
  })
  return new Response(stream, {
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

describe('streamPost', () => {
  it('parses a single event from one chunk', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['event: mention\ndata: {"id":"abc"}\n\n']),
    )
    const events: SseEvent[] = []
    const onClose = vi.fn()
    await streamPost('/x', { q: 'test' }, { onEvent: (e) => events.push(e), onClose })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ event: 'mention', data: { id: 'abc' } })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('parses multiple events from one chunk', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse([
        'event: a\ndata: {"i":1}\n\nevent: b\ndata: {"i":2}\n\n',
      ]),
    )
    const events: SseEvent[] = []
    await streamPost('/x', null, { onEvent: (e) => events.push(e) })
    expect(events.map((e) => e.event)).toEqual(['a', 'b'])
    expect(events.map((e) => (e.data as { i: number }).i)).toEqual([1, 2])
  })

  it('parses event split across chunks', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['event: split\ndata: {"hel', 'lo":"world"}\n\n']),
    )
    const events: SseEvent[] = []
    await streamPost('/x', null, { onEvent: (e) => events.push(e) })
    expect(events).toHaveLength(1)
    expect(events[0]?.data).toEqual({ hello: 'world' })
  })

  it('concatenates multi-line data with \\n', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['event: msg\ndata: line one\ndata: line two\n\n']),
    )
    const events: SseEvent[] = []
    await streamPost('/x', null, { onEvent: (e) => events.push(e) })
    // Not JSON-parseable → falls back to raw string.
    expect(events[0]?.data).toBe('line one\nline two')
  })

  it('defaults event name to "message" when omitted', async () => {
    fetchMock.mockResolvedValueOnce(streamResponse(['data: {"x":1}\n\n']))
    const events: SseEvent[] = []
    await streamPost('/x', null, { onEvent: (e) => events.push(e) })
    expect(events[0]?.event).toBe('message')
  })

  it('skips comment lines starting with :', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse([': keepalive\nevent: real\ndata: {"ok":true}\n\n']),
    )
    const events: SseEvent[] = []
    await streamPost('/x', null, { onEvent: (e) => events.push(e) })
    expect(events).toHaveLength(1)
    expect(events[0]?.event).toBe('real')
  })

  it('handles CRLF line endings', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['event: win\r\ndata: {"k":1}\r\n\r\n']),
    )
    const events: SseEvent[] = []
    await streamPost('/x', null, { onEvent: (e) => events.push(e) })
    expect(events[0]?.data).toEqual({ k: 1 })
  })

  it('invokes onError on non-2xx response and skips events', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['event: a\ndata: {}\n\n'], {
        status: 500,
        statusText: 'Internal',
      }),
    )
    const events: SseEvent[] = []
    const onError = vi.fn()
    const onClose = vi.fn()
    await streamPost('/x', null, { onEvent: (e) => events.push(e), onError, onClose })
    expect(events).toHaveLength(0)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resolves quietly when aborted (no onError fired)', async () => {
    const controller = new AbortController()
    // Stream that never closes by itself — abort will cancel it.
    const stream = new ReadableStream<Uint8Array>({
      start() {
        // empty — never enqueues, never closes
      },
    })
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => {
      // Simulate fetch honoring the abort signal.
      return new Promise<Response>((resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
        // Also expose a resolution path so the test doesn't hang if abort
        // never fires (which would be a test bug).
        setTimeout(() => {
          resolve(
            new Response(stream, {
              status: 200,
              headers: { 'Content-Type': 'text/event-stream' },
            }),
          )
        }, 50)
      })
    })

    const onError = vi.fn()
    const onClose = vi.fn()
    const promise = streamPost(
      '/x',
      null,
      { onError, onClose },
      controller.signal,
    )
    // Abort immediately so fetch promise rejects with AbortError.
    controller.abort()
    await promise
    expect(onError).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('fires onClose even when onError fires', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const onError = vi.fn()
    const onClose = vi.fn()
    await streamPost('/x', null, { onError, onClose })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('omits Authorization header when no token is stored', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['event: mention\ndata: {}\n\n']),
    )
    await streamPost('/x', { query: 'baches' }, {})
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    // Body is passed through as-is (new contract uses { query }).
    expect(init.body).toBe(JSON.stringify({ query: 'baches' }))
  })

  it('attaches Bearer header when a token is stored (// API PENDIENTE auth real)', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tok.sse.123')
    try {
      fetchMock.mockResolvedValueOnce(
        streamResponse(['event: mention\ndata: {}\n\n']),
      )
      await streamPost('/x', { query: 'q' }, {})
      const init = fetchMock.mock.calls[0]?.[1] as RequestInit
      const headers = init.headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer tok.sse.123')
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  })
})

describe('Pulso mention normalization (new contract)', () => {
  it('maps short sent codes to canonical labels', () => {
    expect(shortSentToLabel('neg')).toBe('negative')
    expect(shortSentToLabel('pos')).toBe('positive')
    expect(shortSentToLabel('neu')).toBe('neutral')
    expect(shortSentToLabel('mix')).toBe('mixed')
    expect(shortSentToLabel('sar')).toBe('sarcastic')
    expect(shortSentToLabel('???')).toBeNull()
    expect(shortSentToLabel(null)).toBeNull()
  })

  it('recognizes the compact wire shape', () => {
    expect(isPulsoMentionWire({ plat: 'twitter', text: 'hi' })).toBe(true)
    expect(isPulsoMentionWire({ sent: 'neg' })).toBe(true)
    // Canonical Mention shape (platform/content) is NOT a wire mention.
    expect(isPulsoMentionWire({ platform: 'twitter', content: 'x' })).toBe(false)
    expect(isPulsoMentionWire(null)).toBe(false)
  })

  it('normalizes a full wire mention into the canonical Mention shape', () => {
    const wire: PulsoMentionWire = {
      plat: 'twitter',
      author: '@critico_mx',
      text: 'Los baches son insoportables',
      score: -0.87,
      sent: 'neg',
      eng: [234, 98, 41],
      timestamp: '2026-06-20T10:00:00Z',
      url: 'https://x.com/critico_mx/1',
    }
    const m = normalizePulsoMention(wire, { politicianId: 'pol-1' })
    expect(m.platform).toBe('twitter')
    expect(m.author).toBe('@critico_mx')
    expect(m.author_handle).toBe('@critico_mx')
    expect(m.content).toBe('Los baches son insoportables')
    expect(m.sentiment_score).toBe(-0.87)
    expect(m.sentiment_label).toBe('negative')
    expect(m.engagement_metrics).toEqual({ likes: 234, reposts: 98, comments: 41 })
    expect(m.url).toBe('https://x.com/critico_mx/1')
    expect(m.collected_at).toBe('2026-06-20T10:00:00Z')
    expect(m.politician_id).toBe('pol-1')
    expect(typeof m.id).toBe('string')
    expect(m.id.length).toBeGreaterThan(0)
  })

  it('fills sane fallbacks for a sparse wire mention and produces unique ids', () => {
    const a = normalizePulsoMention({ text: 'a' })
    const b = normalizePulsoMention({ text: 'b' })
    expect(a.platform).toBe('unknown')
    expect(a.sentiment_label).toBeNull()
    expect(a.sentiment_score).toBeNull()
    expect(a.engagement_metrics).toEqual({})
    expect(a.url).toBe('')
    expect(typeof a.collected_at).toBe('string')
    // Synthesized ids differ for distinct events.
    expect(a.id).not.toBe(b.id)
  })

  it('honors an explicit backend id when present', () => {
    const m = normalizePulsoMention({ id: 'srv-99', text: 'x', plat: 'bluesky' })
    expect(m.id).toBe('srv-99')
    expect(m.external_id).toBe('srv-99')
  })
})
