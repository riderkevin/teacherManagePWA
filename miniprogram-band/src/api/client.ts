import Taro from '@tarojs/taro'

// API 基础地址（与后端部署在同一服务器）
const SERVER_HOST = '124.223.170.68'
export const API_BASE = `http://${SERVER_HOST}`

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
}

/**
 * 封装 Taro.request，乐队端公开只读接口无需鉴权
 */
export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data } = options

  const res = await Taro.request({
    url: `${API_BASE}${path}`,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
    },
  })

  if (res.statusCode >= 200 && res.statusCode < 300) {
    return res.data as T
  }

  throw new Error((res.data as any)?.error || `请求失败 (${res.statusCode})`)
}

// ═══════════════════════════════════════════
// 演出日程
// ═══════════════════════════════════════════

export async function getPerformances() {
  return apiRequest<any[]>('/api/wx-band/performances')
}

// ═══════════════════════════════════════════
// 排练日程
// ═══════════════════════════════════════════

export async function getRehearsals() {
  return apiRequest<any[]>('/api/wx-band/rehearsals')
}

// ═══════════════════════════════════════════
// 排练歌单
// ═══════════════════════════════════════════

export async function getSongs() {
  return apiRequest<any[]>('/api/wx-band/songs')
}

// 获取曲谱文件数据 URL
export function getSheetDataUrl(songId: number): string {
  return `/api/wx-band/sheet-data/${songId}`
}

// ═══════════════════════════════════════════
// 网盘资源
// ═══════════════════════════════════════════

export async function getCloudFiles() {
  return apiRequest<any[]>('/api/wx-band/cloud-files')
}

// 获取网盘文件数据 URL
export function getFileDataUrl(fileId: number): string {
  return `/api/wx-band/file-data/${fileId}`
}

// ═══════════════════════════════════════════
// 文件预览/下载工具
// ═══════════════════════════════════════════

/** base64 转 ArrayBuffer */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof Taro.base64ToArrayBuffer === 'function') {
    try {
      return Taro.base64ToArrayBuffer(base64)
    } catch { /* 降级 */ }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let clean = base64.replace(/[^A-Za-z0-9+/=]/g, '')
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

/** 预览文件：通过JSON接口获取base64 → 写临时文件 → openDocument打开 */
export async function previewFile(apiPath: string, fileName?: string) {
  try {
    const res: any = await apiRequest(apiPath)
    if (!res || !res.base64) throw new Error('无文件数据')

    const fs = Taro.getFileSystemManager()
    const ext = res.mimeType?.split('/')[1] || 'bin'
    const safeName = (res.fileName || fileName || 'file').replace(/[^a-zA-Z0-9._一-鿿-]/g, '_')
    const tmpPath = `${Taro.env.USER_DATA_PATH}/${safeName}.${ext}`

    const buffer = base64ToArrayBuffer(res.base64)
    fs.writeFileSync(tmpPath, buffer)

    await Taro.openDocument({ filePath: tmpPath, showMenu: true })
  } catch (err) {
    console.error('预览文件失败:', err)
    Taro.showToast({ title: '预览失败，请重试', icon: 'error' })
  }
}
