import { request } from './client'
import type { Student, Lesson, Payment, WxLog } from '../types'

// 复用 src/types 的类型定义

export async function getAllStudents(): Promise<Student[]> {
  return request<Student[]>('/api/students')
}

export async function getStudentById(id: number): Promise<Student | undefined> {
  try {
    return await request<Student>(`/api/students/${id}`)
  } catch {
    return undefined
  }
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/students', {
    method: 'POST',
    body: JSON.stringify(student),
  })
  return result.id
}

export async function updateStudent(id: number, changes: Partial<Student>): Promise<void> {
  await request(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteStudentCascade(id: number): Promise<number> {
  const result = await request<{ ok: boolean; lessonCount: number }>(`/api/students/${id}`, {
    method: 'DELETE',
  })
  return result.lessonCount
}

export async function deleteStudent(id: number): Promise<void> {
  await request(`/api/students/${id}`, { method: 'DELETE' })
}

export async function getLessonsByStudentId(studentId: number): Promise<Lesson[]> {
  return request<Lesson[]>(`/api/students/${studentId}/lessons`)
}

export async function getPaymentsByStudentId(studentId: number): Promise<Payment[]> {
  return request<Payment[]>(`/api/students/${studentId}/payments`)
}

export async function getStudentPackageStats(studentId: number): Promise<{
  totalPaid: number
  currentPackageLabel: string
  currentRemaining: number
}> {
  return request(`/api/students/${studentId}/stats`)
}

export async function getStudentWxLogs(studentId: number): Promise<WxLog[]> {
  return request<WxLog[]>(`/api/students/${studentId}/wx-logs`)
}
