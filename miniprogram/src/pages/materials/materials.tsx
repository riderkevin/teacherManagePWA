import { useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyMaterialsEnriched, previewFile, downloadFileToLocal } from '../../api/client'
import '../../app.scss'

function getFileDataUrl(id: number) {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `/api/wx/file-data/${id}?openid=${encodeURIComponent(openid)}`
}
function getMaterialFileDataUrl(id: number) {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `/api/wx/material-file-data/${id}?openid=${encodeURIComponent(openid)}`
}

// 分类展示顺序
const CATEGORY_ORDER = [
  '演奏技法',
  '曲目与乐段',
  '机能与节奏感',
  '乐理',
  '设备知识',
  '软件使用',
  '其他',
]

// 难度星级
function renderDifficulty(level: number | null) {
  if (!level || level <= 0) return null
  const stars = '★'.repeat(Math.min(level, 10))
  return (
    <Text style={{ fontSize: '22rpx', color: '#F59E0B', marginLeft: '8rpx', flexShrink: 0 }}>
      {stars}
    </Text>
  )
}

// 课件操作按钮
function MaterialBtn({ color, bg, border, onClick, children }: {
  color: string; bg: string; border: string; onClick: () => void; children: string
}) {
  const textColor = color === 'blue' ? '#2563EB' : '#16A34A'
  return (
    <View
      onClick={onClick}
      style={{
        padding: '8rpx 24rpx',
        borderRadius: '8rpx',
        backgroundColor: bg,
        border: `1rpx solid ${border}`,
      }}
    >
      <Text style={{ fontSize: '24rpx', color: textColor }}>{children}</Text>
    </View>
  )
}

export default function MaterialsPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [allMats, setAllMats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [searchText, setSearchText] = useState('')

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
      const mats = await getMyMaterialsEnriched()
      setAllMats(Array.isArray(mats) ? mats : [])
    } catch (err) {
      console.error('加载课件失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 按分类分组
  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    for (const mat of allMats) {
      // 没有 materialId 的是本地文件 → 归入"其他"
      const cat = mat.materialId ? (mat.category || '其他') : '其他'
      if (!grouped[cat]) grouped[cat] = []
      // 搜索过滤
      if (searchText) {
        const q = searchText.trim().toLowerCase()
        if (q) {
          // 一级标题（用于"其他"类型的回退）
          const firstTitle = mat.parentContent || mat.materialContent || mat.text || ''
          // 具体名称
          const itemName = mat.text || mat.fileName || ''
          const haystack = [
            mat.text, mat.fileName, mat.materialContent, mat.parentContent,
            firstTitle, itemName, mat.category,
          ].filter(Boolean).join(' ').toLowerCase()
          if (!haystack.includes(q)) continue
        }
      }
      grouped[cat].push(mat)
    }
    return grouped
  }, [allMats, searchText])

  // 在每个分类内，按一级标题分组
  function groupByParent(mats: any[]) {
    const groups: { parentTitle: string; items: any[] }[] = []
    const map = new Map<string, number>()
    for (const mat of mats) {
      // 一级标题：有 parentContent 就用它，否则用 materialContent，都没有就用 text
      const parentTitle = mat.parentContent || mat.materialContent || mat.text || '(未分类)'
      const idx = map.get(parentTitle)
      if (idx !== undefined) {
        groups[idx].items.push(mat)
      } else {
        map.set(parentTitle, groups.length)
        groups.push({ parentTitle, items: [mat] })
      }
    }
    return groups
  }

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  // 预览
  const handlePreview = (mat: any) => {
    if (mat.fileData) {
      previewFile(getFileDataUrl(mat.id), mat.fileName)
      return
    }
    if (mat.fileLink && mat.fileLink.startsWith('data:')) {
      previewFile(getFileDataUrl(mat.id), mat.fileName)
      return
    }
    if (mat.materialId && (!mat.fileLink || mat.fileLink.startsWith('data:'))) {
      previewFile(getMaterialFileDataUrl(mat.materialId), mat.fileName || '课件')
      return
    }
    if (mat.fileLink && /^https?:\/\//.test(mat.fileLink)) {
      Taro.setClipboardData({ data: mat.fileLink })
      Taro.showToast({ title: '链接已复制，请在浏览器打开', icon: 'success' })
      return
    }
    if (mat.text) {
      Taro.showToast({ title: '此为文字备注，无附件文件', icon: 'none' })
    }
  }

  // 下载
  const handleDownload = (mat: any) => {
    if (mat.fileData) {
      downloadFileToLocal(getFileDataUrl(mat.id), mat.fileName)
    } else if (mat.materialId) {
      downloadFileToLocal(getMaterialFileDataUrl(mat.materialId), mat.fileName || '课件')
    } else if (mat.fileLink && /^https?:\/\//.test(mat.fileLink)) {
      Taro.setClipboardData({ data: mat.fileLink })
      Taro.showToast({ title: '链接已复制，请在浏览器打开下载', icon: 'success' })
    }
  }

  // 是否可下载
  const canDownload = (mat: any) => !!(mat.fileData || mat.materialId)

  if (loading) {
    return <View className="container"><View className="loading"><Text>加载中…</Text></View></View>
  }

  const totalCount = allMats.length

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View className="container">
        <Text className="page-title">课件资料</Text>

        {/* 搜索栏 */}
        <View style={{
          marginTop: '16rpx', marginBottom: '20rpx',
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#F1F5F9', borderRadius: '16rpx',
          padding: '0 24rpx',
        }}>
          <Text style={{ fontSize: '28rpx', color: '#94A3B8', marginRight: '12rpx' }}>🔍</Text>
          <Input
            placeholder="搜索课件、练习名称"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            style={{ flex: 1, height: '72rpx', fontSize: '28rpx' }}
          />
          {searchText && (
            <Text
              onClick={() => setSearchText('')}
              style={{ fontSize: '28rpx', color: '#94A3B8', padding: '8rpx' }}
            >
              ✕
            </Text>
          )}
        </View>

        <Text className="page-subtitle">
          {searchText ? `搜到 ${Object.values(groupedByCategory).flat().length} 个课件` : `共 ${totalCount} 个课件附件`}
        </Text>

        {/* 分类列表 */}
        {CATEGORY_ORDER.map((cat) => {
          const catMats = groupedByCategory[cat]
          if (!catMats || catMats.length === 0) return null
          const isCollapsed = collapsed[cat]
          const parentGroups = groupByParent(catMats)

          return (
            <View key={cat} style={{ marginTop: '24rpx' }}>
              {/* 分类标题 — 可折叠 */}
              <View
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20rpx 24rpx',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16rpx',
                  border: '1rpx solid #E2E8F0',
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A' }}>
                    {cat}
                  </Text>
                  <Text style={{
                    fontSize: '24rpx', color: '#64748B', marginLeft: '12rpx',
                    backgroundColor: '#E2E8F0', borderRadius: '20rpx',
                    padding: '2rpx 14rpx',
                  }}>
                    {catMats.length}
                  </Text>
                </View>
                <Text style={{ fontSize: '24rpx', color: '#94A3B8' }}>
                  {isCollapsed ? '▶' : '▼'}
                </Text>
              </View>

              {/* 分类下的内容 */}
              {!isCollapsed && (
                <View style={{ marginTop: '12rpx' }}>
                  {parentGroups.map((group, gi) => (
                    <View
                      key={gi}
                      style={{
                        marginBottom: '12rpx',
                        padding: '20rpx 24rpx',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12rpx',
                        border: '1rpx solid #F1F5F9',
                      }}
                    >
                      {/* 一级标题 */}
                      <View style={{ marginBottom: '12rpx' }}>
                        <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#1E3A5F' }}>
                          {group.parentTitle}
                        </Text>
                      </View>

                      {/* 课件列表 */}
                      {group.items.map((mat: any, mi: number) => {
                        // 子类型标题：仅当有父级且子标题与父级不同时才显示（避免重复）
                        const subTitle = (mat.parentContent && mat.materialContent && mat.materialContent !== mat.parentContent)
                          ? mat.materialContent : null
                        // 具体课件名
                        const itemName = mat.text || mat.fileName || '(无标题)'
                        const fileName = mat.fileName || ''
                        const downloadable = canDownload(mat)

                        return (
                          <View
                            key={mat.id || mi}
                            style={{
                              padding: '16rpx 20rpx',
                              backgroundColor: '#F8FAFC',
                              borderRadius: '12rpx',
                              marginBottom: '8rpx',
                            }}
                          >
                            {/* 子类型标题 */}
                            {subTitle && (
                              <View style={{ marginBottom: '4rpx' }}>
                                <Text style={{ fontSize: '24rpx', color: '#475569', fontWeight: 500 }}>
                                  {subTitle}
                                </Text>
                              </View>
                            )}

                            {/* 具体课件名 + 难度 */}
                            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontSize: '26rpx', color: '#334155', flex: 1 }}>
                                {mi + 1}. {itemName}
                              </Text>
                              {renderDifficulty(mat.difficulty)}
                            </View>

                            {/* 附件名称 */}
                            {fileName && (
                              <View style={{ marginTop: '6rpx' }}>
                                <Text style={{ fontSize: '22rpx', color: '#64748B' }}>
                                  附件 · {fileName}
                                </Text>
                              </View>
                            )}

                            {/* 操作按钮 */}
                            <View style={{
                              display: 'flex', flexDirection: 'row', gap: '16rpx',
                              marginTop: '12rpx',
                            }}>
                              <MaterialBtn
                                color="blue" bg="#EFF6FF" border="#BFDBFE"
                                onClick={() => handlePreview(mat)}
                              >
                                点击查看
                              </MaterialBtn>
                              {downloadable && (
                                <MaterialBtn
                                  color="green" bg="#F0FDF4" border="#BBF7D0"
                                  onClick={() => handleDownload(mat)}
                                >
                                  下载到本地
                                </MaterialBtn>
                              )}
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}

        {/* 空状态 */}
        {allMats.length === 0 && (
          <View className="empty-state" style={{ paddingTop: '60rpx' }}>
            <Text className="empty-icon">📂</Text>
            <Text className="empty-text">暂无课件，上完课后老师会上传</Text>
          </View>
        )}

        {/* 搜索无结果 */}
        {allMats.length > 0 && Object.values(groupedByCategory).every((arr) => arr.length === 0) && (
          <View className="empty-state" style={{ paddingTop: '60rpx' }}>
            <Text className="empty-icon">🔍</Text>
            <Text className="empty-text">未找到匹配的课件</Text>
          </View>
        )}

        {/* 底部留白 */}
        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  )
}
