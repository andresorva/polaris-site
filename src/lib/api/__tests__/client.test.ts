/**
 * Smoke tests for `apiGet`/`apiPost`.
 *
 * Strategy: mock global `fetch`. Use fake timers and drive them explicitly
 * with `vi.runAllTimersAsync()` so the exponential-backoff sleeps resolve
 * instantly and DETERMINISTICALLY — never waiting real wall-clock time.
 * (The previous `shouldAdvanceTime: true` coupled fake timers to real time,
 * which raced on slow CI runners and made these tests flaky, blocking deploy.)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet, apiPost } from '../client'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiGet', () => {
  it('returns typed JSON on 200', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { hello: 'world' }))
    const result = await apiGet<{ hello: string }>('/test')
    expect(result).toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('serializes query params into the URL', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, []))
    await apiGet('/items', { limit: 10, offset: 0, name: 'a' })
    const url = fetchMock.mock.calls[0]?.[0] as string
    expect(url).toContain('limit=10')
    expect(url).toContain('offset=0')
    expect(url).toContain('name=a')
  })

  it('retries on 5xx and succeeds on the 3rd attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, { error: 'boom' }))
      .mockResolvedValueOnce(jsonResponse(503, { error: 'still boom' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const promise = apiGet<{ ok: boolean }>('/flaky')
    // Drive the 1s + 2s backoff sleeps to completion under fake timers.
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry on 4xx and throws ApiError immediately', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { detail: 'nope' }))

    await expect(apiGet('/missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws ApiError(0, "Request timeout...") when fetch aborts', async () => {
    // Simulate AbortError thrown by fetch when the controller aborts.
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        }
      })
    })

    const promise = apiGet('/slow')
    // Prevent an unhandled-rejection warning while we drive the timers; the
    // assertions below are what actually validate the rejection.
    promise.catch(() => {})
    // Drive the 10s timeout on each attempt AND both retry backoffs (1s + 2s).
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({ status: 0 })
  })
})

describe('apiPost', () => {
  it('sends JSON body and content-type header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { answer: '42' }))
    const body = { question: 'meaning of life' }
    const result = await apiPost<{ answer: string }, typeof body>('/ask', body)

    expect(result).toEqual({ answer: '42' })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify(body))
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })
})
