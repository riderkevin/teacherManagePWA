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
    const buffer = base64ToArrayBuffer(base64)
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

/** base64 转 ArrayBuffer（兼容真机无 Taro.base64ToArrayBuffer 的情况，不使用 atob） */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // 1. 优先使用微信原生 API（基础库 2.14+）
  if (typeof Taro.base64ToArrayBuffer === 'function') {
    try {
      return Taro.base64ToArrayBuffer(base64)
    } catch { /* 降级到手动解码 */ }
  }
  // 2. 手动解码 base64（兼容所有环境）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let clean = base64.replace(/[^A-Za-z0-9+/=]/g, '')
  // 补齐 padding
  while (clean.length % 4 !== 0) clean += '='
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 4) {
    const a = chars.indexOf(clean[i])
    const b = chars.indexOf(clean[i + 1])
    const c = clean[i + 2] === '=' ? -1 : chars.indexOf(clean[i + 2])
    const d = clean[i + 3] === '=' ? -1 : chars.indexOf(clean[i + 3])
    bytes.push((a << 2) | (b >> 4))
    if (c !== -1) bytes.push(((b & 15) << 4) | (c >> 2))
    if (d !== -1) bytes.push(((c & 3) << 6) | d)
  }
  return new Uint8Array(bytes).buffer
}

// 下载文件到本地：通过JSON接口获取base64 → 写文件 → 打开
export async function downloadFileToLocal(url: string, fileName?: string) {
  let filePath = ''
  try {
    Taro.showLoading({ title: '下载中…' })
    const res: any = await apiRequest(url)
    if (!res || !res.base64) throw new Error('无文件数据')

    const fs = Taro.getFileSystemManager()
    const originalName = res.fileName || fileName || 'file'
    // 仅移除路径分隔符 / 和控制字符，保留空格、#、中文等原始文件名
    const cleanName = originalName.replace(/[/\x00-\x1f]/g, '')
    // 如果文件名已有后缀则直接使用，否则从 mimeType 补充
    const hasExtension = /\.[a-zA-Z0-9]{1,10}$/.test(cleanName)
    filePath = `${Taro.env.USER_DATA_PATH}/${cleanName}${hasExtension ? '' : '.' + (res.mimeType?.split('/')[1] || 'bin')}`

    const buffer = base64ToArrayBuffer(res.base64)
    fs.writeFileSync(filePath, buffer)

    Taro.hideLoading()

    // 显示保存路径并询问是否打开
    Taro.showModal({
      title: '下载完成',
      content: `已保存至小程序存储目录：\n${filePath}\n\n点击「打开文件」预览，或通过右上角菜单转发给朋友。`,
      confirmText: '打开文件',
      cancelText: '关闭',
      success: (modalRes) => {
        if (modalRes.confirm) {
          Taro.openDocument({
            filePath,
            showMenu: true,
            fail: (err) => {
              console.error('打开文件失败:', err)
              Taro.showModal({
                title: '无法预览',
                content: '此文件格式暂不支持预览，但已保存到小程序存储中。',
                showCancel: false,
              })
            },
          })
        }
      },
    })
  } catch (err) {
    console.error('下载文件失败:', err, '路径:', filePath)
    Taro.hideLoading()
    Taro.showToast({ title: '下载失败，请重试', icon: 'error' })
  }
}
