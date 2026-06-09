import { request } from './client'
import type { Lesson } from '../types'

export async function getAllLessons(): Promise<Lesson[]> {
  return request<Lesson[]>('/api/lessons')
}

export async function getUpcomingLessons(days: number = 3): Promise<Lesson[]> {
  return request<Lesson[]>(`/api/lessons/upcoming?days=${days}`)
}

export async function getLessonMonths(): Promise<string[]> {
  return request<string[]>('/api/lessons/months')
}

export async function addLesson(lesson: Omit<Lesson, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(lesson),
  })
  return result.id
}

export async function updateLesson(id: number, changes: Partial<Lesson>): Promise<void> {
  await request(`/api/lessons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteLesson(id: number): Promise<void> {
  await request(`/api/lessons/${id}`, { method: 'DELETE' })
}

export async function getLessonsByMonth(month: string): Promise<Lesson[]> {
  // 暂时从所有课程中过滤（后续可加服务端参数）
  const all = await getAllLessons()
  return all.filter((l) => l.month === month).sort((a, b) => a.startTime.localeCompare(b.startTime))
}
