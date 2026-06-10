import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'

// API 基础地址（备案期间临时用IP，备案后可切换为域名）
const SERVER_HOST = '124.223.170.68'
export const API_BASE = `http://${SERVER_HOST}`

export interface AppState {
  openid: string | null
  isBound: boolean
  studentId: number | null
  studentName: string
  isChecking: boolean
}

// 全局登录检查
export async function checkLogin(): Promise<AppState> {
  try {
    // 1. 先检查本地是否有缓存的 openid
    let openid = Taro.getStorageSync('wx_openid') as string

    if (!openid) {
      // 2. 通过 wx.login 获取 code，发送到服务端换取 openid
      try {
        const loginRes = await Taro.login()
        if (loginRes.code) {
          const result = await Taro.request({
            url: `${API_BASE}/api/wx/login`,
            method: 'POST',
            data: { code: loginRes.code },
          })
          if (result.statusCode === 200 && result.data) {
            openid = (result.data as any).openid
            Taro.setStorageSync('wx_openid', openid)
          }
        }
      } catch {
        // 服务端不可用时，用本地模拟 openid
        openid = 'wx_local_' + Date.now()
        Taro.setStorageSync('wx_openid', openid)
      }
    }

    // 3. 用 openid 查询服务端绑定状态
    try {
      const profileRes = await Taro.request({
        url: `${API_BASE}/api/wx/profile`,
        method: 'GET',
        header: { 'x-wx-openid': openid },
      })
      if (profileRes.statusCode === 200) {
        const data = profileRes.data as any
        return {
          openid,
          isBound: true,
          studentId: data.id,
          studentName: data.displayName || data.wechatNickname || '',
          isChecking: false,
        }
      }
    } catch {
      // 未绑定或网络错误
    }

    return {
      openid,
      isBound: false,
      studentId: null,
      studentName: '',
      isChecking: false,
    }
  } catch (err) {
    console.error('登录检查失败:', err)
    return {
      openid: null,
      isBound: false,
      studentId: null,
      studentName: '',
      isChecking: false,
    }
  }
}

// React Hook 版本：在组件中自动检查登录状态
export function useGlobalState(): AppState {
  const [state, setState] = useState<AppState>({
    openid: null,
    isBound: false,
    studentId: null,
    studentName: '',
    isChecking: true,
  })

  useEffect(() => {
    checkLogin().then(setState)
  }, [])

  return state
}
