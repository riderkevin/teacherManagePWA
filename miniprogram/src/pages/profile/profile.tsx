import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyProgress } from '../../api/client'
import '../../app.scss'

export default function ProfilePage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [progress, setProgress] = useState<any>(null)

  useEffect(() => {
    checkLogin().then((s) => {
      setState(s)
      if (!s.isBound) {
        Taro.redirectTo({ url: '/pages/bind/bind' })
        return
      }
      loadProgress()
    })
  }, [])

  const loadProgress = async () => {
    try {
      const pg = await getMyProgress()
      setProgress(pg)
    } catch (err) {
      console.error('加载进度失败:', err)
    }
  }

  const handleUnbind = () => {
    Taro.showModal({
      title: '解除绑定',
      content: '确定要解除绑定吗？解除后将无法查看课程数据。',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('bind_info')
          Taro.redirectTo({ url: '/pages/bind/bind' })
        }
      },
    })
  }

  if (state.isChecking) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  return (
    <View className="container">
      {/* 头像区域 */}
      <View style={{ textAlign: 'center', marginBottom: '48rpx', marginTop: '32rpx' }}>
        <View style={{
          width: '120rpx', height: '120rpx', borderRadius: '60rpx',
          backgroundColor: '#1E3A5F', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: '48rpx', fontWeight: 700 }}>
            {state.studentName?.slice(0, 1) || '?'}
          </Text>
        </View>
        <Text style={{ fontSize: '36rpx', fontWeight: 700, color: '#0F172A', marginTop: '16rpx', display: 'block' }}>
          {state.studentName}
        </Text>
      </View>

      {/* 课时统计 */}
      {progress && (
        <View className="card">
          <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#0F172A', marginBottom: '24rpx' }}>
            学习数据
          </Text>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '24rpx' }}>
            <View style={{ flex: 1, textAlign: 'center' }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#1E3A5F' }}>{progress.totalLessons}</Text>
              <Text style={{ fontSize: '24rpx', color: '#94A3B8', display: 'block' }}>已完成(节)</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'center' }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#1E3A5F' }}>{progress.totalHours}</Text>
              <Text style={{ fontSize: '24rpx', color: '#94A3B8', display: 'block' }}>总课时</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'center' }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 700, color: progress.currentRemaining > 0 ? '#059669' : '#EF4444' }}>
                {progress.currentRemaining}
              </Text>
              <Text style={{ fontSize: '24rpx', color: '#94A3B8', display: 'block' }}>剩余课时</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: '12rpx', padding: '16rpx 20rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#64748B' }}>
              累计缴费：¥{progress.totalPaid}
            </Text>
          </View>
        </View>
      )}

      {/* 操作 */}
      <View className="card">
        <View
          onClick={handleUnbind}
          style={{
            textAlign: 'center',
            padding: '16rpx 0',
          }}
        >
          <Text style={{ fontSize: '28rpx', color: '#EF4444' }}>解除绑定</Text>
        </View>
      </View>

      <Text style={{ textAlign: 'center', fontSize: '22rpx', color: '#CBD5E1', marginTop: '48rpx' }}>
        吉他教室 · 学生端 v1.0
      </Text>
    </View>
  )
}
