import Taro from '@tarojs/taro'
import { API_BASE } from '../app'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

/**
 * 封装 Taro.request，自动附带 openid 鉴权
 */
export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, needAuth = true } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (needAuth) {
    const openid = Taro.getStorageSync('wx_openid')
    if (openid) {
      headers['x-wx-openid'] = openid
    }
  }

  const res = await Taro.request({
    url: `${API_BASE}${path}`,
    method,
    data,
    header: headers,
  })

  if (res.statusCode >= 200 && res.statusCode < 300) {
    return res.data as T
  }

  throw new Error((res.data as any)?.error || `请求失败 (${res.statusCode})`)
}

// ── 绑定 ──
export async function bindWithCode(code: string): Promise<{
  ok: boolean
  studentId: number
  studentName: string
  error?: string
}> {
  try {
    const result = await apiRequest<{
      ok: boolean
      studentId: number
      studentName: string
    }>('/api/wx/bind', {
      method: 'POST',
      data: { code },
      needAuth: true,
    })
    return result
  } catch (err: any) {
    return { ok: false, studentId: 0, studentName: '', error: err.message }
  }
}

// ── 学生数据 ──
export async function getMyProfile() {
  return apiRequest<any>('/api/wx/profile')
}

export async function getMyLessons(limit = 50) {
  return apiRequest<any[]>(`/api/wx/lessons?limit=${limit}`)
}

export async function getMyUpcoming() {
  return apiRequest<any[]>('/api/wx/upcoming')
}

export async function getMyProgress() {
  return apiRequest<{
    totalLessons: number
    totalHours: number
    totalPaid: number
    currentRemaining: number
  }>('/api/wx/progress')
}

export async function getLessonMaterials(lessonId: number) {
  return apiRequest<any[]>(`/api/wx/materials/${lessonId}`)
}
