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
import { streamPost, type SseEvent } from '../sse'

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
})
