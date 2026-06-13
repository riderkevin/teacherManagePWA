import { request } from './client'
import type { CloudFile } from '../types'

export async function getAllCloudFiles(): Promise<CloudFile[]> {
  return request<CloudFile[]>('/api/cloud-files')
}

export async function addCloudFile(file: Omit<CloudFile, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/cloud-files', {
    method: 'POST',
    body: JSON.stringify(file),
  })
  return result.id
}

export async function updateCloudFile(id: number, changes: Partial<CloudFile>): Promise<void> {
  await request(`/api/cloud-files/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteCloudFile(id: number): Promise<void> {
  await request(`/api/cloud-files/${id}`, { method: 'DELETE' })
}
