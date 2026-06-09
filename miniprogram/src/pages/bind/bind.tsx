import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../app'
import { bindWithCode } from '../../api/client'
import '../../app.scss'

export default function BindPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [state, setState] = useState<AppState | null>(null)

  useState(() => {
    checkLogin().then((s) => {
      setState(s)
      if (s.isBound) {
        Taro.switchTab({ url: '/pages/index/index' })
      }
    })
  })

  const handleBind = async () => {
    if (!code.trim()) {
      setError('请输入老师给的绑定码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await bindWithCode(code.trim().toUpperCase())

      if (result.ok) {
        // 保存绑定信息到本地
        Taro.setStorageSync('bind_info', {
          studentId: result.studentId,
          studentName: result.studentName,
        })

        Taro.showToast({ title: '绑定成功！', icon: 'success', duration: 2000 })
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 2000)
      } else {
        setError(result.error || '绑定失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (state?.isBound) {
    return (
      <View className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: '32rpx', color: '#059669' }}>已绑定，正在跳转…</Text>
      </View>
    )
  }

  return (
    <View className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      {/* Logo */}
      <View style={{ textAlign: 'center', marginBottom: '48rpx' }}>
        <Text style={{ fontSize: '80rpx' }}>🎸</Text>
        <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#0F172A', display: 'block', marginTop: '16rpx' }}>
          吉他教室
        </Text>
        <Text style={{ fontSize: '28rpx', color: '#94A3B8', marginTop: '8rpx', display: 'block' }}>
          请输入老师给的绑定码
        </Text>
      </View>

      {/* 输入框 */}
      <View className="card">
        <Input
          value={code}
          onInput={(e) => setCode(e.detail.value.toUpperCase())}
          placeholder="输入6位绑定码，如 ABC123"
          maxlength={6}
          style={{
            textAlign: 'center',
            fontSize: '48rpx',
            fontWeight: 700,
            letterSpacing: '16rpx',
            color: '#1E3A5F',
            fontFamily: 'monospace',
            padding: '24rpx 0',
          }}
        />

        {error && (
          <Text style={{ color: '#EF4444', fontSize: '24rpx', textAlign: 'center', display: 'block', marginBottom: '16rpx' }}>
            {error}
          </Text>
        )}

        <View
          onClick={handleBind}
          style={{
            backgroundColor: code.trim() ? '#1E3A5F' : '#CBD5E1',
            borderRadius: '16rpx',
            padding: '24rpx',
            textAlign: 'center',
            marginTop: '16rpx',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: '32rpx', fontWeight: 600 }}>
            {loading ? '绑定中…' : '确认绑定'}
          </Text>
        </View>
      </View>

      <Text style={{ textAlign: 'center', fontSize: '24rpx', color: '#CBD5E1', marginTop: '32rpx' }}>
        请向老师索要绑定码
      </Text>
    </View>
  )
}
