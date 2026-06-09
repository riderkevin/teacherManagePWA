import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

// 全局状态
export interface AppState {
  openid: string | null
  isBound: boolean
  studentId: number | null
  studentName: string
  isChecking: boolean
}

export const useGlobalState = (): AppState => {
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

// 全局登录检查
export async function checkLogin(): Promise<AppState> {
  try {
    // 1. 获取微信 openid（实际应该通过 wx.login 获取 code，发送到服务端换取 openid）
    const loginRes = await Taro.login()
    const code = loginRes.code

    // 2. 将 code 发送到我们的服务端，服务端换取 openid
    //    服务端返回 openid（实际部署时，服务端调用微信 API）
    //    开发阶段：使用简化的 openid（从本地存储读取，或生成一个模拟的）
    let openid = Taro.getStorageSync('wx_openid')

    if (!openid) {
      // 生成临时标识（正式环境应通过服务端换取）
      openid = 'wx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
      Taro.setStorageSync('wx_openid', openid)
    }

    // 3. 检查绑定状态
    //    实际部署后：GET /api/wx/profile (header: x-wx-openid)
    //    由于小程序需要配置服务器域名，开发阶段先本地模拟
    const bindInfo = Taro.getStorageSync('bind_info')
    if (bindInfo && bindInfo.studentId) {
      return {
        openid,
        isBound: true,
        studentId: bindInfo.studentId,
        studentName: bindInfo.studentName || '',
        isChecking: false,
      }
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

// API 基础地址（部署后改为实际域名）
export const API_BASE = 'https://your-domain.com'

function App({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default App
