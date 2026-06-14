// 排练日程页面
import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getRehearsals } from '../../api/client'
import '../../app.scss'

export default function RehearsalsPage() {
  const [rehearsals, setRehearsals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getRehearsals()
      setRehearsals(data)
    } catch (err) {
      console.error('加载排练日程失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-')
    return `${parts[0]}.${parseInt(parts[1])}.${parseInt(parts[2])}`
  }

  if (loading) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View className="container">
        <Text className="page-title">排练日程</Text>
        <Text className="page-subtitle">共 {rehearsals.length} 次排练</Text>

        {rehearsals.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🥁</Text>
            <Text className="empty-text">暂无排练安排</Text>
          </View>
        ) : (
          rehearsals.map((event) => (
            <View key={event.id} className="card" style={{ padding: '28rpx 32rpx' }}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#0F172A' }}>
                  {formatDate(event.date)}
                </Text>
              </View>

              {/* 排练信息 */}
              <View style={{ marginTop: '12rpx' }}>
                {/* 时间 + 时长 */}
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '6rpx' }}>
                  <Text style={{ fontSize: '24rpx', color: '#64748B', marginRight: '8rpx' }}>⏰</Text>
                  <Text style={{ fontSize: '26rpx', color: '#475569' }}>
                    {event.startTime}-{event.endTime}
                  </Text>
                  {event.duration && (
                    <Text style={{ fontSize: '24rpx', color: '#94A3B8', marginLeft: '12rpx' }}>
                      ({event.duration}h)
                    </Text>
                  )}
                </View>

                {/* 地点 */}
                {event.location && (
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '6rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#64748B', marginRight: '8rpx' }}>📍</Text>
                    <Text style={{ fontSize: '26rpx', color: '#475569' }}>{event.location}</Text>
                  </View>
                )}

                {/* 备注 */}
                {event.notes && (
                  <View style={{ marginTop: '8rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#94A3B8' }}>备注：{event.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  )
}
