import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { sha256 } from 'js-sha256'
import { checkFirstTime, setupPassword, login as apiLogin, verifyToken, logout as apiLogout, setAuthToken, getAuthToken } from '../api'

const AUTH_TOKEN_KEY = 'auth_token'

interface AuthState {
  isAuthenticated: boolean
  isFirstTime: boolean
  isLoading: boolean
  login: (password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 启动时检查登录状态
  useEffect(() => {
    const init = async () => {
      try {
        // 检查是否需要首次设置密码
        const firstTime = await checkFirstTime()
        if (firstTime) {
          setIsFirstTime(true)
          setIsLoading(false)
          return
        }

        // 检查本地是否有 token
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
        if (token) {
          setAuthToken(token)
          const valid = await verifyToken()
          if (valid) {
            setIsAuthenticated(true)
            setIsLoading(false)
            return
          }
          // token 无效，清除
          setAuthToken(null)
          sessionStorage.removeItem(AUTH_TOKEN_KEY)
        }
      } catch {
        // API 不可达，保持未登录状态
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const hashPassword = async (text: string): Promise<string> => sha256(text)

  const login = async (password: string): Promise<{ ok: boolean; error?: string }> => {
    // 先尝试检查是否是首次使用
    const firstTime = await checkFirstTime()

    if (password.length < 4) {
      return { ok: false, error: '密码至少 4 位' }
    }

    const hash = await hashPassword(password)

    try {
      if (firstTime) {
        // 首次设置密码
        await setupPassword(hash)
      } else {
        // 登录验证
        const result = await apiLogin(hash)
        if (!result.ok) {
          return result
        }
      }

      // 登录成功，保存 token
      const token = getAuthToken()
      if (token) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token)
      }
      setIsAuthenticated(true)
      setIsFirstTime(false)
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err.message || '服务不可用' }
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // 网络错误也允许退出
    }
    setAuthToken(null)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isFirstTime, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
