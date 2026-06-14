// 演出日程页面
import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getPerformances } from '../../api/client'
import '../../app.scss'

export default function PerformancesPage() {
  const [performances, setPerformances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getPerformances()
      setPerformances(data)
    } catch (err) {
      console.error('加载演出日程失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 格式化日期 YYYY/MM/DD → YYYY.M.D
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
        <Text className="page-title">演出日程</Text>
        <Text className="page-subtitle">共 {performances.length} 场演出</Text>

        {performances.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🎤</Text>
            <Text className="empty-text">暂无演出安排</Text>
          </View>
        ) : (
          performances.map((event) => {
            const isExpanded = expandedIds.has(event.id)
            const setlist = event.setlist || []

            return (
              <View key={event.id} className="card" style={{ padding: '28rpx 32rpx' }}>
                {/* 一级：日期-演出名称 + 展开箭头 */}
                <View
                  onClick={() => toggleExpand(event.id)}
                  style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A' }}>
                      {formatDate(event.date)} {event.title}
                    </Text>
                    {/* 演出地点 */}
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '8rpx' }}>
                      <Text style={{ fontSize: '24rpx', color: '#64748B', marginRight: '8rpx' }}>📍</Text>
                      <Text style={{ fontSize: '26rpx', color: '#475569' }}>{event.location}</Text>
                    </View>
                    {/* 演出地址 */}
                    {event.address && (
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '4rpx' }}>
                        <Text style={{ fontSize: '24rpx', color: '#64748B', marginRight: '8rpx' }}>🏠</Text>
                        <Text style={{ fontSize: '24rpx', color: '#64748B' }}>{event.address}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: '24rpx', color: '#94A3B8', flexShrink: 0, marginLeft: '16rpx' }}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </View>

                {/* 二级内容（可折叠） */}
                {isExpanded && (
                  <View style={{ marginTop: '20rpx', borderTop: '1rpx solid #E2E8F0', paddingTop: '16rpx' }}>
                    {/* 演出曲目 */}
                    {setlist.length > 0 && (
                      <View style={{ marginBottom: '16rpx' }}>
                        <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#0F172A', marginBottom: '10rpx', display: 'block' }}>
                          演出曲目
                        </Text>
                        {setlist.map((song: any, idx: number) => (
                          <View
                            key={song.id}
                            style={{
                              padding: '12rpx 16rpx',
                              backgroundColor: '#F8FAFC',
                              borderRadius: '10rpx',
                              marginBottom: '6rpx',
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{
                              fontSize: '22rpx', color: '#94A3B8', fontWeight: 600,
                              width: '40rpx', flexShrink: 0,
                            }}>
                              {idx + 1}.
                            </Text>
                            <Text style={{ fontSize: '26rpx', color: '#334155', flex: 1 }}>{song.title}</Text>
                            {song.artist && (
                              <Text style={{ fontSize: '22rpx', color: '#94A3B8', flexShrink: 0 }}>{song.artist}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* 演出语言 */}
                    {event.language && (
                      <View style={{ marginBottom: '8rpx' }}>
                        <Text style={{ fontSize: '24rpx', color: '#64748B' }}>
                          演出语言：<Text style={{ color: '#1E40AF', fontWeight: 500 }}>{event.language}</Text>
                        </Text>
                      </View>
                    )}

                    {/* 备注 */}
                    {event.notes && (
                      <View>
                        <Text style={{ fontSize: '24rpx', color: '#94A3B8' }}>备注：{event.notes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          })
        )}

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  )
}
