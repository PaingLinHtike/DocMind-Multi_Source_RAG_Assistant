import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, resetCsrfState } from './client.js'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('API client', () => {
  beforeEach(() => {
    resetCsrfState()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses the configured API origin, includes credentials, and preserves resource envelopes', async () => {
    const envelope = { data: [{ id: 'doc-1' }], meta: { current_page: 1, total: 1 } }
    fetch.mockResolvedValueOnce(jsonResponse(envelope))

    const result = await apiRequest('/api/v1/documents')

    expect(result).toEqual(envelope)
    expect(fetch).toHaveBeenCalledWith('http://api.test/api/v1/documents', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ Accept: 'application/json' }),
      method: 'GET',
    }))
  })

  it('returns null for an empty 204 response', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(apiRequest('/api/v1/auth/logout', { method: 'POST' })).resolves.toBeNull()
  })

  it.each([
    ['text', 'document text'],
    ['blob', new Blob(['document bytes'], { type: 'application/pdf' })],
  ])('parses %s responses', async (responseType, expected) => {
    const response = responseType === 'text'
      ? new Response(expected)
      : new Response(expected, { headers: { 'Content-Type': expected.type } })
    fetch.mockResolvedValueOnce(response)

    const result = await apiRequest('/api/v1/documents/doc-1/content', { responseType })

    if (responseType === 'blob') {
      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/pdf')
    } else {
      expect(result).toBe(expected)
    }
  })

  it('encodes plain request bodies as JSON', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'conversation-1' } }, 201))

    await apiRequest('/api/v1/conversations', { method: 'POST', body: { title: 'Benefits' } })

    expect(fetch).toHaveBeenNthCalledWith(2, 'http://api.test/api/v1/conversations', expect.objectContaining({
      body: JSON.stringify({ title: 'Benefits' }),
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'csrf-token',
      }),
    }))
  })

  it('sends FormData without forcing a content type', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const body = new FormData()
    body.append('document', new Blob(['hello'], { type: 'text/plain' }), 'notes.txt')
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'doc-1' } }, 201))

    await apiRequest('/api/v1/documents', { method: 'POST', body })

    const options = fetch.mock.calls[1][1]
    expect(options.body).toBe(body)
    expect(options.headers).not.toHaveProperty('Content-Type')
  })

  it('shares one lazy CSRF initialization between concurrent unsafe requests', async () => {
    document.cookie = 'XSRF-TOKEN=shared%20token; path=/'
    let releaseCsrf
    fetch.mockImplementation((url) => {
      if (url.endsWith('/sanctum/csrf-cookie')) {
        return new Promise((resolve) => { releaseCsrf = () => resolve(new Response(null, { status: 204 })) })
      }
      return Promise.resolve(jsonResponse({ data: { ok: true } }))
    })

    const first = apiRequest('/api/v1/account/profile', { method: 'PATCH', body: { name: 'A' } })
    const second = apiRequest('/api/v1/account/password', { method: 'PUT', body: { password: 'B' } })
    await vi.waitFor(() => expect(releaseCsrf).toBeTypeOf('function'))
    releaseCsrf()
    await Promise.all([first, second])

    expect(fetch.mock.calls.filter(([url]) => url.endsWith('/sanctum/csrf-cookie'))).toHaveLength(1)
    expect(fetch.mock.calls.slice(1).every(([, options]) => options.headers['X-XSRF-TOKEN'] === 'shared token')).toBe(true)
  })

  it('refreshes CSRF and retries once after a 419 response', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'CSRF token mismatch.' }, 419))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: { name: 'Aung' } }))

    const result = await apiRequest('/api/v1/account/profile', { method: 'PATCH', body: { name: 'Aung' } })

    expect(result).toEqual({ data: { name: 'Aung' } })
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('does not retry a second 419 response', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'CSRF token mismatch.' }, 419))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'CSRF token mismatch.' }, 419))

    await expect(apiRequest('/api/v1/account/profile', { method: 'PATCH', body: {} }))
      .rejects.toMatchObject({ status: 419, message: 'CSRF token mismatch.' })
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('preserves Laravel validation errors in ApiError', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({
        message: 'The given data was invalid.',
        errors: { email: ['The email has already been taken.'] },
      }, 422))

    await expect(apiRequest('/api/v1/auth/register', { method: 'POST', body: {} }))
      .rejects.toEqual(expect.objectContaining({
        name: 'ApiError',
        status: 422,
        errors: { email: ['The email has already been taken.'] },
      }))
  })

  it('normalizes network failures', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/v1/dashboard')).rejects.toEqual(expect.objectContaining({
      name: 'ApiError',
      status: 0,
      message: 'Unable to connect to the server. Please try again.',
    }))
  })

  it('exports errors that can be identified with instanceof', () => {
    expect(new ApiError('Nope', { status: 500 })).toBeInstanceOf(ApiError)
  })
})
