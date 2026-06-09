import { request } from './client'

export async function resetToSeedData(): Promise<void> {
  await request('/api/seed/reset', { method: 'POST' })
}

export async function seedIfEmpty(): Promise<boolean> {
  const result = await request<{ isEmpty: boolean }>('/api/seed/status')
  if (result.isEmpty) {
    await resetToSeedData()
    return true
  }
  return false
}
