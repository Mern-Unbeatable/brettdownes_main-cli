const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request(method, path, { body, signal, formData } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body && !formData ? { 'content-type': 'application/json' } : undefined,
      body: formData ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  if (response.status === 204) return null

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error || `Request failed (${response.status}).`,
      payload?.details,
    )
  }

  return payload
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
  upload: (path, file) => {
    const data = new FormData()
    data.append('file', file)
    return request('POST', path, { body: data, formData: true })
  },
}

/** Resolves a stored image path against the API origin when needed. */
export function assetUrl(value) {
  if (!value) return ''
  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) return value
  if (value.startsWith('/uploads/')) return `${BASE}${value}`
  return value
}

export function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

export function formatCents(cents) {
  return formatPrice((Number(cents) || 0) / 100)
}
