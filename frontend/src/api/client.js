const DEFAULT_API_URL = 'http://localhost:8000'
const SAFE_METHODS = new Set(['GET', 'HEAD'])
const NETWORK_ERROR_MESSAGE = 'Unable to connect to the server. Please try again.'

let csrfRequest = null

export class ApiError extends Error {
  constructor(message, { status = 0, errors = {}, data = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.data = data
  }
}

function getApiUrl() {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

function readCookie(name) {
  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

async function initializeCsrf() {
  if (!csrfRequest) {
    csrfRequest = fetch(`${getApiUrl()}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        throw await createApiError(response)
      }
    }).catch((error) => {
      csrfRequest = null
      throw normalizeError(error)
    })
  }

  return csrfRequest
}

async function parseResponse(response, responseType) {
  if (response.status === 204) return null
  if (responseType === 'blob') return response.blob()
  if (responseType === 'text') return response.text()

  const contentType = response.headers.get('Content-Type') || ''
  if (!contentType.includes('json')) {
    const text = await response.text()
    return text || null
  }

  return response.json()
}

async function createApiError(response) {
  let data

  try {
    data = await parseResponse(response, 'json')
  } catch {
    data = null
  }

  return new ApiError(data?.message || `Request failed with status ${response.status}.`, {
    status: response.status,
    errors: data?.errors || {},
    data,
  })
}

function normalizeError(error) {
  if (error instanceof ApiError) return error
  return new ApiError(NETWORK_ERROR_MESSAGE, { data: error })
}

async function performRequest(path, options, hasRetriedCsrf) {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
    responseType = 'json',
  } = options
  const normalizedMethod = method.toUpperCase()
  const isUnsafe = !SAFE_METHODS.has(normalizedMethod)

  if (isUnsafe) await initializeCsrf()

  const requestHeaders = { Accept: 'application/json', ...headers }
  let requestBody = body

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json'
    requestBody = requestHeaders['Content-Type'].includes('application/json') ? JSON.stringify(body) : body
  }

  if (isUnsafe) {
    const csrfToken = readCookie('XSRF-TOKEN')
    if (csrfToken) requestHeaders['X-XSRF-TOKEN'] = csrfToken
  }

  let response
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: normalizedMethod,
      credentials: 'include',
      headers: requestHeaders,
      body: requestBody,
      signal,
    })
  } catch (error) {
    throw normalizeError(error)
  }

  if (response.status === 419 && isUnsafe && !hasRetriedCsrf) {
    resetCsrfState()
    await initializeCsrf()
    return performRequest(path, options, true)
  }

  if (!response.ok) throw await createApiError(response)
  return parseResponse(response, responseType)
}

export function apiRequest(path, options = {}) {
  return performRequest(path, options, false)
}

export function resetCsrfState() {
  csrfRequest = null
}
