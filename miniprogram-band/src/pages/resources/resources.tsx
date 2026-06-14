// 资料与网盘页面
import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getCloudFiles, getFileDataUrl, previewFile, API_BASE } from '../../api/client'
import '../../app.scss'

const CATEGORIES = ['全部', '乐队资料', '演出资料', '其他'] as const

export default function ResourcesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('全部')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getCloudFiles()
      setFiles(data)
    } catch (err) {
      console.error('加载资料失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 处理文件点击
  const handleFileClick = (file: any) => {
    // 有上传文件 → 预览
    if (file.fileData || (file.fileLink && file.fileLink.startsWith('data:'))) {
      previewFile(getFileDataUrl(file.id), file.fileName || '文件')
      return
    }
    // 有外部链接 → 复制链接并提示
    if (file.fileLink && /^https?:\/\//.test(file.fileLink)) {
      Taro.setClipboardData({ data: file.fileLink })
      Taro.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none', duration: 2000 })
      return
    }
    // 纯文字备注
    if (file.notes) {
      Taro.showToast({ title: '此为文字资料，无附件', icon: 'none' })
    }
  }

  const filteredFiles = activeCategory === '全部'
    ? files
    : files.filter((f) => f.category === activeCategory)

  // 分类标签颜色
  const categoryBadgeClass = (cat: string) => {
    if (cat === '乐队资料') return 'badge-blue'
    if (cat === '演出资料') return 'badge-amber'
    return 'badge-slate'
  }

  if (loading) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View className="container">
        <Text className="page-title">资料与网盘</Text>

        {/* 分类筛选 */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: '12rpx', marginTop: '20rpx', marginBottom: '24rpx' }}>
          {CATEGORIES.map((cat) => {
            const count = cat === '全部' ? files.length : files.filter((f) => f.category === cat).length
            return (
              <View
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10rpx 24rpx',
                  borderRadius: '20rpx',
                  backgroundColor: activeCategory === cat ? '#1E3A5F' : '#F1F5F9',
                }}
              >
                <Text style={{
                  fontSize: '24rpx',
                  fontWeight: 500,
                  color: activeCategory === cat ? '#FFFFFF' : '#64748B',
                }}>
                  {cat} {count}
                </Text>
              </View>
            )
          })}
        </View>

        <Text className="page-subtitle">共 {filteredFiles.length} 个资料</Text>

        {filteredFiles.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📂</Text>
            <Text className="empty-text">暂无资料</Text>
          </View>
        ) : (
          filteredFiles.map((file) => (
            <View
              key={file.id}
              className="card"
              style={{ padding: '28rpx 32rpx' }}
              onClick={() => handleFileClick(file)}
            >
              {/* 标题 + 分类标签 */}
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#0F172A', flex: 1 }}>
                  {file.title || '(无标题)'}
                </Text>
                <Text className={`badge ${categoryBadgeClass(file.category)}`} style={{ flexShrink: 0, marginLeft: '12rpx' }}>
                  {file.category}
                </Text>
              </View>

              {/* 文件信息 */}
              <View style={{ marginTop: '12rpx' }}>
                {/* 上传文件 */}
                {file.fileName && (file.fileData || (file.fileLink && file.fileLink.startsWith('data:'))) && (
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '6rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#64748B', marginRight: '8rpx' }}>📎</Text>
                    <Text style={{ fontSize: '24rpx', color: '#475569' }}>{file.fileName}</Text>
                  </View>
                )}
                {/* 外部链接 */}
                {file.fileLink && /^https?:\/\//.test(file.fileLink) && (
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '6rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#64748B', marginRight: '8rpx' }}>🔗</Text>
                    <Text style={{ fontSize: '24rpx', color: '#2563EB' }} numberOfLines={1}>{file.fileLink}</Text>
                  </View>
                )}
                {/* 备注 */}
                {file.notes && (
                  <View>
                    <Text style={{ fontSize: '24rpx', color: '#94A3B8' }} numberOfLines={2}>{file.notes}</Text>
                  </View>
                )}
              </View>

              {/* 点击提示 */}
              {(file.fileData || file.fileLink) && (
                <View style={{ marginTop: '10rpx' }}>
                  <Text style={{ fontSize: '22rpx', color: '#2563EB' }}>
                    {file.fileLink && /^https?:\/\//.test(file.fileLink) ? '点击复制链接 →' : '点击查看文件 →'}
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
