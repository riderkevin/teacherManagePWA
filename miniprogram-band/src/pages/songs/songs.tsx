// 排练歌单页面
import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getSongs, getSheetDataUrl, previewFile } from '../../api/client'
import '../../app.scss'

export default function SongsPage() {
  const [songs, setSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getSongs()
      setSongs(data)
    } catch (err) {
      console.error('加载歌单失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 查看曲谱
  const handleViewSheet = (song: any) => {
    if (song.sheetData) {
      previewFile(getSheetDataUrl(song.id), song.sheetFileName || '曲谱')
    } else {
      // 无曲谱时不做任何操作
    }
  }

  // 版本标签颜色
  const versionBadgeClass = (v: string) => {
    if (v === '原唱') return 'badge-blue'
    if (v === '翻唱版') return 'badge-amber'
    return 'badge-slate'
  }

  // 编排标签颜色
  const arrBadgeClass = (a: string) => {
    if (a === '乐队') return 'badge-emerald'
    if (a === '不插电') return 'badge-violet'
    return 'badge-slate'
  }

  if (loading) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View className="container">
        <Text className="page-title">排练歌单</Text>
        <Text className="page-subtitle">共 {songs.length} 首曲目</Text>

        {songs.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🎵</Text>
            <Text className="empty-text">暂无曲目</Text>
          </View>
        ) : (
          songs.map((song) => (
            <View key={song.id} className="card" style={{ padding: '28rpx 32rpx' }}>
              {/* 歌名 + 歌手 */}
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A' }}>
                    {song.title}
                  </Text>
                  {song.artist && (
                    <Text style={{ fontSize: '24rpx', color: '#64748B', marginTop: '4rpx', display: 'block' }}>
                      {song.artist}
                    </Text>
                  )}
                </View>
                {/* 曲谱按钮 */}
                {song.sheetData && (
                  <View
                    onClick={() => handleViewSheet(song)}
                    style={{
                      padding: '10rpx 20rpx',
                      borderRadius: '10rpx',
                      backgroundColor: '#EFF6FF',
                      border: '1rpx solid #BFDBFE',
                      flexShrink: 0,
                      marginLeft: '16rpx',
                    }}
                  >
                    <Text style={{ fontSize: '24rpx', color: '#2563EB' }}>查看曲谱</Text>
                  </View>
                )}
              </View>

              {/* 标签行 */}
              <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10rpx', marginTop: '14rpx' }}>
                {song.ip && (
                  <Text className={`badge badge-violet`}>{song.ip}</Text>
                )}
                {song.version && (
                  <Text className={`badge ${versionBadgeClass(song.version)}`}>{song.version}</Text>
                )}
                {song.arrangement && (
                  <Text className={`badge ${arrBadgeClass(song.arrangement)}`}>{song.arrangement}</Text>
                )}
              </View>

              {/* 详情行：BPM / 调 / 时长 */}
              <View style={{ display: 'flex', flexDirection: 'row', marginTop: '12rpx', gap: '24rpx' }}>
                {song.bpm && (
                  <View>
                    <Text style={{ fontSize: '22rpx', color: '#94A3B8' }}>BPM</Text>
                    <Text style={{ fontSize: '26rpx', color: '#475569', fontWeight: 500, display: 'block' }}>
                      {song.bpm}
                    </Text>
                  </View>
                )}
                {song.songKey && (
                  <View>
                    <Text style={{ fontSize: '22rpx', color: '#94A3B8' }}>调</Text>
                    <Text style={{ fontSize: '26rpx', color: '#475569', fontWeight: 500, display: 'block' }}>
                      {song.songKey}
                    </Text>
                  </View>
                )}
                {song.duration && (
                  <View>
                    <Text style={{ fontSize: '22rpx', color: '#94A3B8' }}>时长</Text>
                    <Text style={{ fontSize: '26rpx', color: '#475569', fontWeight: 500, display: 'block' }}>
                      {song.duration}
                    </Text>
                  </View>
                )}
              </View>

              {/* 曲谱附件名 */}
              {song.sheetFileName && song.sheetData && (
                <View style={{ marginTop: '10rpx' }}>
                  <Text style={{ fontSize: '22rpx', color: '#94A3B8' }}>
                    📎 {song.sheetFileName}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  )
}
