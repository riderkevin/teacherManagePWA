import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyLessons, getAllMyMaterials, getFileDownloadUrl } from '../../api/client'
import '../../app.scss'

export default function MaterialsPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [grouped, setGrouped] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkLogin().then((s) => {
      setState(s)
      if (!s.isBound) {
        Taro.redirectTo({ url: '/pages/bind/bind' })
        return
      }
      loadMaterials()
    })
  }, [])

  const loadMaterials = async () => {
    try {
      const [lessons, allMats] = await Promise.all([
        getMyLessons(200),
        getAllMyMaterials(),
      ])

      // 按课程ID分组附件
      const matMap = new Map<number, any[]>()
      if (Array.isArray(allMats)) {
        for (const mat of allMats) {
          const arr = matMap.get(mat.lessonId) || []
          arr.push(mat)
          matMap.set(mat.lessonId, arr)
        }
      }

      // 将有附件的课程按日期倒序排列
      const result = lessons
        .filter((l) => matMap.has(l.id) && l.status !== '放鸽子')
        .map((l) => ({
          ...l,
          materials: matMap.get(l.id) || [],
        }))

      setGrouped(result)
    } catch (err) {
      console.error('加载课件失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  const formatDate = (startTime: string) => {
    const [datePart] = startTime.split(' ')
    const [, m, d] = datePart.split('/')
    return `${m}月${d}日`
  }

  return (
    <ScrollView className="container" scrollY>
      <Text className="page-title">课件资料</Text>
      <Text className="page-subtitle">{grouped.length} 节课有课件</Text>

      {grouped.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">📂</Text>
          <Text className="empty-text">暂无课件，上完课后老师会上传</Text>
        </View>
      ) : (
        grouped.map((lesson) => (
          <View key={lesson.id} className="card">
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '16rpx' }}>
              <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#0F172A' }}>
                {formatDate(lesson.startTime)} {lesson.title}
              </Text>
            </View>
            {lesson.materials.map((mat: any, idx: number) => (
              <View key={mat.id || idx} style={{
                padding: '16rpx 20rpx',
                backgroundColor: '#F8FAFC',
                borderRadius: '12rpx',
                marginBottom: '8rpx',
              }}>
                <Text style={{ fontSize: '26rpx', color: '#334155' }}>
                  {idx + 1}. {mat.text || mat.fileName || '(无标题)'}
                </Text>

                {/* 飞书/http 链接 */}
                {mat.fileLink && /^https?:\/\//.test(mat.fileLink) && (
                  <Text
                    style={{ fontSize: '22rpx', color: '#2563EB', marginTop: '4rpx', display: 'block' }}
                    onClick={() => {
                      Taro.setClipboardData({ data: mat.fileLink })
                      Taro.showToast({ title: '链接已复制', icon: 'success' })
                    }}
                  >
                    📎 复制文档链接
                  </Text>
                )}

                {/* 本地上传的文件 */}
                {mat.fileData && !mat.fileLink?.startsWith('http') && (
                  <Text
                    style={{ fontSize: '22rpx', color: '#059669', marginTop: '4rpx', display: 'block' }}
                    onClick={() => {
                      const url = getFileDownloadUrl(mat.id)
                      // 复制下载链接，提示用户在浏览器中打开
                      Taro.setClipboardData({
                        data: url,
                      })
                      Taro.showModal({
                        title: '文件下载',
                        content: '下载链接已复制。由于小程序限制，请在浏览器中粘贴打开下载。',
                        showCancel: false,
                      })
                    }}
                  >
                    📥 下载文件 ({mat.fileName || '附件'})
                  </Text>
                )}

                {/* 课件库关联 */}
                {mat.materialId && !mat.fileData && !mat.fileLink && (
                  <Text style={{ fontSize: '22rpx', color: '#7C3AED', marginTop: '4rpx', display: 'block' }}>
                    📋 来自课件库
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  )
}
