import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyLessons, getAllMyMaterials, getFileDownloadUrl, getMaterialFileUrl, previewFile } from '../../api/client'
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

  // 处理课件点击
  const handleMatClick = (mat: any) => {
    // 本地上传文件 → 预览
    if (mat.fileData) {
      previewFile(getFileDownloadUrl(mat.id), mat.fileName)
      return
    }
    // 课件库关联的文件 → 预览
    if (mat.materialId && !mat.fileLink) {
      previewFile(getMaterialFileUrl(mat.materialId), mat.fileName)
      return
    }
    // HTTP链接 → 复制
    if (mat.fileLink && /^https?:\/\//.test(mat.fileLink)) {
      Taro.setClipboardData({ data: mat.fileLink })
      Taro.showToast({ title: '链接已复制，请在浏览器打开', icon: 'success' })
      return
    }
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
            <View style={{ marginBottom: '16rpx' }}>
              <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#0F172A' }}>
                {formatDate(lesson.startTime)} {lesson.title}
              </Text>
            </View>
            {lesson.materials.map((mat: any, idx: number) => (
              <View
                key={mat.id || idx}
                onClick={() => handleMatClick(mat)}
                style={{
                  padding: '16rpx 20rpx',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12rpx',
                  marginBottom: '8rpx',
                }}
              >
                <Text style={{ fontSize: '26rpx', color: '#334155' }}>
                  {idx + 1}. {mat.text || mat.fileName || '(无标题)'}
                </Text>

                {/* 文件标识 */}
                {mat.fileData && (
                  <Text style={{ fontSize: '22rpx', color: '#059669', marginTop: '4rpx', display: 'block' }}>
                    📥 {mat.fileName || '点击预览文件'}
                  </Text>
                )}
                {mat.materialId && !mat.fileLink && !mat.fileData && (
                  <Text style={{ fontSize: '22rpx', color: '#7C3AED', marginTop: '4rpx', display: 'block' }}>
                    📋 课件库 · 点击查看
                  </Text>
                )}
                {mat.fileLink && /^https?:\/\//.test(mat.fileLink) && (
                  <Text style={{ fontSize: '22rpx', color: '#2563EB', marginTop: '4rpx', display: 'block' }}>
                    🔗 点击复制文档链接
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
