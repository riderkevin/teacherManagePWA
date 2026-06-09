import { request } from './client'
import type { Material } from '../types'

export async function getAllMaterials(): Promise<Material[]> {
  return request<Material[]>('/api/materials')
}

export async function addMaterial(material: Omit<Material, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/materials', {
    method: 'POST',
    body: JSON.stringify(material),
  })
  return result.id
}

export async function updateMaterial(id: number, changes: Partial<Material>): Promise<void> {
  await request(`/api/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteMaterial(id: number): Promise<void> {
  await request(`/api/materials/${id}`, { method: 'DELETE' })
}
