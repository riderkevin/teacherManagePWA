import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyLessons, getLessonMaterials } from '../../api/client'
import '../../app.scss'

export default function MaterialsPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [lessonsWithMats, setLessonsWithMats] = useState<any[]>([])
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
      const lessons = await getMyLessons(100)
      // 只取有附件且已上课的课程
      const withMats: any[] = []
      for (const lesson of lessons) {
        if (lesson.status === '放鸽子') continue
        try {
          const mats = await getLessonMaterials(lesson.id)
          if (mats.length > 0) {
            withMats.push({ ...lesson, materials: mats })
          }
        } catch {
          // 无附件则跳过
        }
      }
      setLessonsWithMats(withMats)
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
    return `${m}/${d}`
  }

  return (
    <ScrollView className="container" scrollY>
      <Text className="page-title">课件资料</Text>
      <Text className="page-subtitle">{lessonsWithMats.length} 节课有课件</Text>

      {lessonsWithMats.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">📂</Text>
          <Text className="empty-text">暂无课件，上完课后老师会上传</Text>
        </View>
      ) : (
        lessonsWithMats.map((lesson) => (
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
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  )
}
