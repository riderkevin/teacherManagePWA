import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyLessons } from '../../api/client'
import '../../app.scss'

export default function LessonsPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkLogin().then((s) => {
      setState(s)
      if (!s.isBound) {
        Taro.redirectTo({ url: '/pages/bind/bind' })
        return
      }
      loadLessons()
    })
  }, [])

  const loadLessons = async () => {
    try {
      const data = await getMyLessons(100)
      setLessons(data)
    } catch (err) {
      console.error('加载课程失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  const formatDate = (startTime: string) => {
    const [date] = startTime.split(' ')
    const [, m, d] = date.split('/')
    return `${m}月${d}日`
  }

  const statusClass = (status: string) => {
    if (status === '已上课') return 'badge-green'
    if (status === '放鸽子') return 'badge-slate'
    return 'badge-blue'
  }

  // 按月份分组
  const grouped: Record<string, any[]> = {}
  lessons.forEach((l) => {
    const month = l.month || '其他'
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(l)
  })

  return (
    <ScrollView className="container" scrollY>
      <Text className="page-title">上课记录</Text>
      <Text className="page-subtitle">共 {lessons.length} 节课</Text>

      {Object.keys(grouped).length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">📭</Text>
          <Text className="empty-text">暂无课程记录</Text>
        </View>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <View key={month}>
            <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#64748B', marginBottom: '16rpx', display: 'block' }}>
              {month} ({items.length}节)
            </Text>
            {items.map((lesson) => (
              <View key={lesson.id} className="card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '28rpx', fontWeight: 500, color: '#0F172A' }}>
                    {lesson.title}
                  </Text>
                  <Text style={{ fontSize: '24rpx', color: '#94A3B8', marginTop: '6rpx' }}>
                    {formatDate(lesson.startTime)} · {lesson.duration}课时
                  </Text>
                </View>
                <Text className={`badge ${statusClass(lesson.status)}`}>
                  {lesson.status}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  )
}
