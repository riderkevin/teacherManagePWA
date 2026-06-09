import { request, setAuthToken } from './client'

export async function checkFirstTime(): Promise<boolean> {
  const result = await request<{ isFirstTime: boolean }>('/api/auth/check')
  return result.isFirstTime
}

export async function setupPassword(passwordHash: string): Promise<void> {
  const result = await request<{ ok: boolean; token: string }>('/api/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ passwordHash }),
  })
  setAuthToken(result.token)
}

export async function login(passwordHash: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await request<{ ok: boolean; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ passwordHash }),
    })
    setAuthToken(result.token)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || '登录失败' }
  }
}

export async function verifyToken(): Promise<boolean> {
  try {
    await request('/api/auth/verify')
    return true
  } catch {
    return false
  }
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' })
  setAuthToken(null)
}
