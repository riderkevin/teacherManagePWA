import { request } from './client'
import type { BandEvent, BandSong, BandEventSong } from '../types'

// ── 日程 ──

export async function getAllBandEvents(): Promise<BandEvent[]> {
  return request<BandEvent[]>('/api/band/events')
}

export async function addBandEvent(event: Omit<BandEvent, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/band/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
  return result.id
}

export async function updateBandEvent(id: number, changes: Partial<BandEvent>): Promise<void> {
  await request(`/api/band/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteBandEvent(id: number): Promise<void> {
  await request(`/api/band/events/${id}`, { method: 'DELETE' })
}

// ── 曲目 ──

export async function getAllBandSongs(): Promise<BandSong[]> {
  return request<BandSong[]>('/api/band/songs')
}

export async function addBandSong(song: Omit<BandSong, 'id'>): Promise<number> {
  const result = await request<{ id: number }>('/api/band/songs', {
    method: 'POST',
    body: JSON.stringify(song),
  })
  return result.id
}

export async function updateBandSong(id: number, changes: Partial<BandSong>): Promise<void> {
  await request(`/api/band/songs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export async function deleteBandSong(id: number): Promise<void> {
  await request(`/api/band/songs/${id}`, { method: 'DELETE' })
}

// ── 曲目单 ──

export async function getBandEventSongs(eventId: number): Promise<BandEventSong[]> {
  return request<BandEventSong[]>(`/api/band/events/${eventId}/songs`)
}

export async function setBandEventSongs(eventId: number, songIds: number[]): Promise<void> {
  await request(`/api/band/events/${eventId}/songs`, {
    method: 'POST',
    body: JSON.stringify({ songIds }),
  })
}
