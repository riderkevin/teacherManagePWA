import { request } from './client'

export async function getThisWeekStats(): Promise<number> {
  const result = await request<{ lessons: number; income: number }>('/api/stats/week')
  return result.lessons
}

export async function getThisMonthStats(): Promise<number> {
  const result = await request<{ lessons: number; income: number }>('/api/stats/month')
  return result.lessons
}

export async function getThisWeekIncome(): Promise<number> {
  const result = await request<{ lessons: number; income: number }>('/api/stats/week')
  return result.income
}

export async function getThisMonthIncome(): Promise<number> {
  const result = await request<{ lessons: number; income: number }>('/api/stats/month')
  return result.income
}

export interface DashboardSummary {
  yearIncome: number
  totalIncome: number
  newStudents: number
  renewalStudents: number
  formalCount: number
  trialCount: number
  newFormal: number
  newTrial: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/api/stats/summary')
}

export async function exportAllData(): Promise<any> {
  return request('/api/stats/export')
}

export async function importAllData(data: any): Promise<void> {
  await request('/api/stats/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
