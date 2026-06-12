import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { checkLogin, type AppState } from '../../utils/auth'
import { getMyLessons, getMyProgress, getMyMaterialsEnriched, previewFile } from '../../api/client'
import '../../app.scss'

function getFileDataUrl(id: number) {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `/api/wx/file-data/${id}?openid=${encodeURIComponent(openid)}`
}
function getMaterialFileDataUrl(id: number) {
  const openid = Taro.getStorageSync('wx_openid') || ''
  return `/api/wx/material-file-data/${id}?openid=${encodeURIComponent(openid)}`
}

// ── 格式化工具 ──
function formatTimeRange(startTime: string, endTime?: string) {
  const [, startT] = startTime.split(' ')
  const [, endT] = (endTime || startTime).split(' ')
  return `${startT}-${endT}`
}

function formatCardTitle(lesson: any) {
  const [datePart] = lesson.startTime.split(' ')
  const [y, m, d] = datePart.split('/')
  const dateStr = `${y}.${parseInt(m)}.${parseInt(d)}`
  const match = lesson.title?.match(/课时([\d、]+)/)
  const nums = match ? match[1] : ''
  return nums ? `${dateStr}-课时${nums}` : dateStr
}

function getMonthKey(startTime: string) {
  const [datePart] = startTime.split(' ')
  const [y, m] = datePart.split('/')
  return `${y}年${parseInt(m)}月`
}

function groupByMonth(items: any[]) {
  const grouped: Record<string, any[]> = {}
  items.forEach((l) => {
    const key = getMonthKey(l.startTime)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(l)
  })
  return grouped
}

export default function IndexPage() {
  const [state, setState] = useState<AppState>({
    openid: null, isBound: false, studentId: null, studentName: '', isChecking: true,
  })
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [matMap, setMatMap] = useState<Map<number, any[]>>(new Map())
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
      const [allLessons, pg, allMats] = await Promise.all([
        getMyLessons(200),
        getMyProgress(),
        getMyMaterialsEnriched(),
      ])
      // 仅过滤掉放鸽子，保留未上课和已上课
      const filtered = allLessons
        .filter((l: any) => l.status !== '放鸽子')
        .sort((a: any, b: any) => b.startTime.localeCompare(a.startTime))
      setLessons(filtered)
      setProgress(pg)

      // 课件附件按 lessonId 分组
      const map = new Map<number, any[]>()
      if (Array.isArray(allMats)) {
        for (const mat of allMats) {
          const arr = map.get(mat.lessonId) || []
          arr.push(mat)
          map.set(mat.lessonId, arr)
        }
      }
      setMatMap(map)
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!state.isChecking && !state.isBound) {
      Taro.redirectTo({ url: '/pages/bind/bind' })
    }
  }, [state.isBound, state.isChecking])

  if (state.isChecking || loading) {
    return (
      <View className="container">
        <View className="loading"><Text>加载中…</Text></View>
      </View>
    )
  }

  const totalLessons = lessons.length

  return (
    <ScrollView scrollY style={{ height: '100vh' }}>
      <View className="container">
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
        </View>
      )}

      {/* ── 上课记录（含未上课和已上课，按月分组）── */}
      {Object.entries(groupByMonth(lessons)).length > 0 ? (
        <>
          <View style={{ marginBottom: '16rpx', marginTop: '32rpx' }}>
            <Text style={{ fontSize: '34rpx', fontWeight: 600, color: '#0F172A' }}>上课记录</Text>
          </View>
          {Object.entries(groupByMonth(lessons)).map(([month, items]) => (
            <View key={month}>
              <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#64748B', marginBottom: '16rpx', display: 'block' }}>
                {month} ({items.length}节)
              </Text>
              {items.map((lesson) => renderLessonCard(lesson, matMap))}
            </View>
          ))}
        </>
      ) : (
        <View className="empty-state" style={{ paddingTop: '60rpx' }}>
          <Text className="empty-icon">📭</Text>
          <Text className="empty-text">暂无课程记录</Text>
        </View>
      )}
      </View>
    </ScrollView>
  )
}

// ── 课程卡片 ──
function renderLessonCard(lesson: any, matMap: Map<number, any[]>) {
  const isDone = lesson.status === '已上课'
  const materials = matMap.get(lesson.id) || []

  return (
    <View key={lesson.id} className="card" style={{ padding: '28rpx 32rpx' }}>
      {/* 标题行：日期-课时 + 状态 */}
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#0F172A', flex: 1 }}>
          {formatCardTitle(lesson)}
        </Text>
        <Text style={{
          fontSize: '26rpx',
          fontWeight: 500,
          padding: '6rpx 18rpx',
          borderRadius: '10rpx',
          backgroundColor: isDone ? '#D1FAE5' : '#DBEAFE',
          color: isDone ? '#065F46' : '#1E40AF',
          flexShrink: 0,
          marginLeft: '16rpx',
        }}>
          {lesson.status}
        </Text>
      </View>

      {/* 时间行 */}
      <Text style={{ fontSize: '24rpx', color: '#94A3B8', marginTop: '8rpx', display: 'block' }}>
        {formatTimeRange(lesson.startTime, lesson.endTime)} · {lesson.duration}课时
      </Text>

      {/* 课件附件（嵌入卡片内） */}
      {materials.length > 0 && (
        <View style={{ marginTop: '16rpx', borderTop: '1rpx solid #E2E8F0', paddingTop: '14rpx' }}>
          {materials.map((mat: any, idx: number) => {
            const name = mat.fileName || mat.text || '无名称'
            return (
              <View
                key={mat.id || idx}
                style={{
                  padding: '14rpx 18rpx',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12rpx',
                  marginBottom: '8rpx',
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: '26rpx', color: '#334155', flex: 1 }}>
                    {idx + 1}. {mat.text || mat.fileName || '(无标题)'}
                  </Text>
                  {renderDifficulty(mat.difficulty)}
                </View>
                <View style={{ marginTop: '4rpx' }}>
                  <Text style={{ fontSize: '22rpx', color: '#64748B' }}>{`附件 · ${name}`}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: '16rpx', marginTop: '10rpx' }}>
                  <MaterialBtn onClick={() => handleMatPreview(mat)}>
                    点击查看课件
                  </MaterialBtn>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

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
function MaterialBtn({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <View
      onClick={onClick}
      style={{
        padding: '8rpx 24rpx',
        borderRadius: '8rpx',
        backgroundColor: '#EFF6FF',
        border: '1rpx solid #BFDBFE',
      }}
    >
      <Text style={{ fontSize: '24rpx', color: '#2563EB' }}>{children}</Text>
    </View>
  )
}

// 课件预览/下载处理（在卡片内部调用）
function handleMatPreview(mat: any) {
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

