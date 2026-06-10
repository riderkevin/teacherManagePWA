import Taro from '@tarojs/taro'
import { API_BASE } from '../utils/auth'

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

// 批量获取学生所有课程附件
export async function getAllMyMaterials() {
  return apiRequest<any[]>('/api/wx/materials')
}

// 获取文件下载链接（课程附件），附带 openid 用于鉴权
export function getFileDownloadUrl(materialId: number): string {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `${API_BASE}/api/wx/file/${materialId}?openid=${encodeURIComponent(openid)}`
}

// 获取课件库文件下载链接，附带 openid 用于鉴权
export function getMaterialFileUrl(materialId: number): string {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `${API_BASE}/api/wx/material-file/${materialId}?openid=${encodeURIComponent(openid)}`
}

// 预览/下载文件
export async function previewFile(url: string, fileName?: string) {
  try {
    const res = await Taro.downloadFile({ url })
    if (res.statusCode === 200) {
      await Taro.openDocument({ filePath: res.tempFilePath, showMenu: true })
    } else {
      throw new Error('下载失败')
    }
  } catch {
    // 降级：复制链接在浏览器打开
    Taro.setClipboardData({ data: url })
    Taro.showModal({
      title: '文件预览',
      content: '小程序内无法预览此文件，链接已复制，请在浏览器中粘贴打开下载。',
      showCancel: false,
    })
  }
}
