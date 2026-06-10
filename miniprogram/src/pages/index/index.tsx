import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyUpcoming, getMyLessons, getMyProgress } from '../../api/client'
import '../../app.scss'

export default function IndexPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
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
      const [up, allLessons, pg] = await Promise.all([
        getMyUpcoming(),
        getMyLessons(100),
        getMyProgress(),
      ])
      setUpcoming(up)
      // 历史课程 = 非未上课状态的已结束课程
      const past = allLessons.filter((l) => l.status !== '未上课')
      setHistory(past)
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

  const todayStr = () => {
    const now = new Date()
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
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
      <View style={{ marginBottom: '16rpx', marginTop: '32rpx' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: 600, color: '#0F172A' }}>即将上课</Text>
      </View>

      {upcoming.length === 0 ? (
        <View className="empty-state" style={{ paddingTop: '60rpx' }}>
          <Text className="empty-icon">📅</Text>
          <Text className="empty-text">暂无即将到来的课程</Text>
        </View>
      ) : (
        upcoming.map((lesson) => (
          <View key={lesson.id} className="card" style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A', display: 'block' }}>
              {lesson.title}
            </Text>
            <Text style={{ fontSize: '24rpx', color: '#94A3B8', marginTop: '8rpx', display: 'block' }}>
              {formatDate(lesson.startTime)} · {lesson.duration}课时
            </Text>
          </View>
        ))
      )}

      {/* 历史上课记录 */}
      <View style={{ marginBottom: '16rpx', marginTop: '40rpx' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: 600, color: '#0F172A' }}>历史上课记录</Text>
      </View>

      {history.length === 0 ? (
        <View className="empty-state" style={{ paddingTop: '60rpx' }}>
          <Text className="empty-icon">📖</Text>
          <Text className="empty-text">暂无上课记录</Text>
        </View>
      ) : (
        history.map((lesson) => (
          <View key={lesson.id} className="card" style={{ marginBottom: '16rpx' }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A', display: 'block' }}>
                  {lesson.title}
                </Text>
                <Text style={{ fontSize: '24rpx', color: '#94A3B8', marginTop: '8rpx', display: 'block' }}>
                  {formatDate(lesson.startTime)} · {lesson.duration}课时
                </Text>
              </View>
              <Text style={{
                fontSize: '22rpx',
                padding: '2rpx 12rpx',
                borderRadius: '8rpx',
                backgroundColor: lesson.status === '已上课' ? '#ECFDF5' : '#F1F5F9',
                color: lesson.status === '已上课' ? '#059669' : '#64748B',
                flexShrink: 0,
                marginLeft: '16rpx',
              }}>
                {lesson.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}
