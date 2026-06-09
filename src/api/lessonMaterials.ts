import { request } from './client'
import type { LessonMaterial } from '../types'

export async function getLessonMaterials(lessonId: number): Promise<LessonMaterial[]> {
  return request<LessonMaterial[]>(`/api/lesson-materials/${lessonId}`)
}

export async function addLessonMaterial(m: Omit<LessonMaterial, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/lesson-materials', {
    method: 'POST',
    body: JSON.stringify(m),
  })
  return result.id
}

export async function deleteLessonMaterial(id: number): Promise<void> {
  await request(`/api/lesson-materials/${id}`, { method: 'DELETE' })
}
