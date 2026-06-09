import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../app'
import { getMyUpcoming, getMyProgress } from '../../api/client'
import '../../app.scss'

export default function IndexPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkLogin().then((s) => {
      setState(s)
      if (s.isBound) {
        loadData()
      } else {
        setLoading(false)
      }
    })
  }, [])

  const loadData = async () => {
    try {
      const [up, pg] = await Promise.all([
        getMyUpcoming(),
        getMyProgress(),
      ])
      setUpcoming(up)
      setProgress(pg)
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 未绑定时跳转到绑定页
  useEffect(() => {
    if (!state.isChecking && !state.isBound) {
      Taro.redirectTo({ url: '/pages/bind/bind' })
    }
  }, [state.isBound, state.isChecking])

  if (state.isChecking || loading) {
    return (
      <View className="container">
        <View className="loading">
          <Text>加载中…</Text>
        </View>
      </View>
    )
  }

  const formatDate = (startTime: string) => {
    const [date, time] = startTime.split(' ')
    const [, m, d] = date.split('/')
    return `${m}月${d}日 ${time}`
  }

  return (
    <ScrollView className="container" scrollY>
      {/* 欢迎 */}
      <View style={{ marginBottom: '32rpx' }}>
        <Text className="page-title">你好，{state.studentName}</Text>
        <Text className="page-subtitle">吉他学习之旅</Text>
      </View>

      {/* 学习统计 */}
      {progress && (
        <View className="card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', textAlign: 'center' }}>
          <View>
            <Text className="stat-value">{progress.totalLessons}</Text>
            <Text className="stat-label">已完成</Text>
          </View>
          <View>
            <Text className="stat-value">{progress.totalHours}</Text>
            <Text className="stat-label">总课时</Text>
          </View>
          <View>
            <Text className="stat-value" style={{ color: progress.currentRemaining > 0 ? '#059669' : '#EF4444' }}>
              {progress.currentRemaining}
            </Text>
            <Text className="stat-label">剩余课时</Text>
          </View>
        </View>
      )}

      {/* 即将上课 */}
      <View style={{ marginBottom: '16rpx' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: 600, color: '#0F172A' }}>即将上课</Text>
      </View>

      {upcoming.length === 0 ? (
        <View className="empty-state" style={{ paddingTop: '60rpx' }}>
          <Text className="empty-icon">📅</Text>
          <Text className="empty-text">暂无即将到来的课程</Text>
        </View>
      ) : (
        upcoming.map((lesson) => (
          <View key={lesson.id} className="card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A' }}>
                {lesson.title}
              </Text>
              <Text style={{ fontSize: '24rpx', color: '#94A3B8', marginTop: '8rpx' }}>
                {formatDate(lesson.startTime)} · {lesson.duration}课时
              </Text>
            </View>
            <Text className={`badge ${lesson.lessonType === '试听课' ? 'badge-amber' : 'badge-blue'}`}>
              {lesson.lessonType}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}
