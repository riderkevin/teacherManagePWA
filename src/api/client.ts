const BACKEND = import.meta.env.PROD ? '' : 'http://localhost:3001'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '请求失败' }))
    throw new ApiError(body.error || `HTTP ${res.status}`, res.status)
  }

  return res.json()
}

export { request, ApiError }
