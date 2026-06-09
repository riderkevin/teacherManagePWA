import { request } from './client'
import type { Payment } from '../types'

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(payment),
  })
  return result.id
}

export async function updatePayment(id: number, changes: Partial<Payment>): Promise<void> {
  await request(`/api/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deletePayment(id: number): Promise<void> {
  await request(`/api/payments/${id}`, { method: 'DELETE' })
}
