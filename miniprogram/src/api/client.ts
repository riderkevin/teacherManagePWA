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
export async function unbind(): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiRequest('/api/wx/unbind', { method: 'POST' })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

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

// 获取学生所有课程附件（带课件库分类/难度/层级信息，用于课件分类页）
export async function getMyMaterialsEnriched() {
  return apiRequest<any[]>('/api/wx/materials-enriched')
}

// 获取文件JSON接口（课程附件），附带 openid 用于鉴权
function getFileDataUrl(materialId: number): string {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `${API_BASE}/api/wx/file-data/${materialId}?openid=${encodeURIComponent(openid)}`
}

// 获取课件库文件JSON接口
function getMaterialFileDataUrl(materialId: number): string {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `${API_BASE}/api/wx/material-file-data/${materialId}?openid=${encodeURIComponent(openid)}`
}

// 获取文件下载链接（用于复制到浏览器）
export function getFileDownloadUrl(materialId: number): string {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `${API_BASE}/api/wx/file/${materialId}?openid=${encodeURIComponent(openid)}`
}

export function getMaterialFileUrl(materialId: number): string {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `${API_BASE}/api/wx/material-file/${materialId}?openid=${encodeURIComponent(openid)}`
}

// 预览文件：通过JSON接口获取base64 → 写临时文件 → openDocument打开
export async function previewFile(url: string, fileName?: string) {
  try {
    // 从 JSON 接口获取文件数据
    const res: any = await apiRequest(url)
    if (!res || !res.base64) throw new Error('无文件数据')

    const fs = Taro.getFileSystemManager()
    // 用 fileName + 扩展名作为临时文件名
    const ext = res.mimeType?.split('/')[1] || 'bin'
    const safeName = (res.fileName || fileName || 'file').replace(/[^a-zA-Z0-9._一-鿿-]/g, '_')
    const tmpPath = `${Taro.env.USER_DATA_PATH}/${safeName}.${ext}`

    // base64 → ArrayBuffer → 写文件
    const base64 = res.base64
    const buffer = Taro.base64ToArrayBuffer(base64)
    fs.writeFileSync(tmpPath, buffer)

    await Taro.openDocument({ filePath: tmpPath, showMenu: true })
  } catch (err) {
    console.error('预览文件失败:', err)
    // 降级：复制二进制下载链接
    const downloadUrl = API_BASE + url.replace('/file-data/', '/file/').replace('/material-file-data/', '/material-file/')
    Taro.setClipboardData({ data: downloadUrl })
    Taro.showModal({
      title: '预览失败',
      content: '小程序内暂不支持预览此文件，下载链接已复制，请在浏览器中粘贴打开下载。',
      showCancel: false,
    })
  }
}

// 下载文件到本地：通过JSON接口获取base64 → 写临时文件 → 永久保存
export async function downloadFileToLocal(url: string, fileName?: string) {
  try {
    Taro.showLoading({ title: '下载中…' })
    const res: any = await apiRequest(url)
    if (!res || !res.base64) throw new Error('无文件数据')

    const fs = Taro.getFileSystemManager()
    const ext = res.mimeType?.split('/')[1] || 'bin'
    const safeName = (res.fileName || fileName || 'file').replace(/[^a-zA-Z0-9._一-鿿-]/g, '_')
    const tmpPath = `${Taro.env.USER_DATA_PATH}/${safeName}.${ext}`

    const buffer = Taro.base64ToArrayBuffer(res.base64)
    fs.writeFileSync(tmpPath, buffer)

    Taro.hideLoading()
    Taro.showToast({ title: '已保存到本地', icon: 'success', duration: 1500 })

    // 下载后自动打开文件，用户可通过右上角菜单保存/分享
    setTimeout(() => {
      Taro.openDocument({ filePath: tmpPath, showMenu: true }).catch(() => {})
    }, 500)
  } catch (err) {
    console.error('下载文件失败:', err)
    Taro.hideLoading()
    Taro.showToast({ title: '下载失败，请重试', icon: 'error' })
  }
}
