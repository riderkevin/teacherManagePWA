import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Loader2, Lock, Eye, EyeOff, Music } from 'lucide-react'

export default function Login() {
  const { login, isFirstTime } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isFirstTime && password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const result = await login(password)
    setLoading(false)

    if (!result.ok && result.error) {
      setError(result.error)
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <Music className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">吉他教学管理</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isFirstTime ? '首次使用，请设置登录密码' : '请输入密码登录'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isFirstTime ? '设置密码（至少 4 位）' : '输入密码'}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {isFirstTime && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入密码"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {isFirstTime ? '设置密码并进入' : '登录'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          数据仅存储在本机浏览器中，请妥善保管密码
        </p>
      </div>
    </div>
  )
}
