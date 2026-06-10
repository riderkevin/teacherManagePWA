import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  BookOpen,
  CalendarDays,
  Users,
  ChevronRight,
  Loader2,
  DollarSign,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Database,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  getAllStudents,
  getUpcomingLessons,
  getThisWeekStats,
  getThisMonthStats,
  getThisWeekIncome,
  getThisMonthIncome,
  exportAllData,
  importAllData,
} from '../api'
import { resetToSeedData } from '../api/seed'
import type { Lesson } from '../types'

// ── 从 startTime 提取日期部分 "YYYY/MM/DD" ──
function extractDate(startTime: string): string {
  return startTime.split(' ')[0]
}

// ── 从 startTime 提取时间部分 "HH:MM" ──
function extractTime(startTime: string): string {
  const parts = startTime.split(' ')
  return parts[1] || ''
}

// ── 日期标签生成 ──
function getDateLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split('/').map(Number)
  const target = new Date(y, m - 1, d)
  target.setHours(0, 0, 0, 0)
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  return dateStr
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[] | null>(null)
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [weekStats, setWeekStats] = useState<number | null>(null)
  const [monthStats, setMonthStats] = useState<number | null>(null)
  const [weekIncome, setWeekIncome] = useState<number | null>(null)
  const [monthIncome, setMonthIncome] = useState<number | null>(null)

  // 导入导出状态
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')
  const [resetConfirm, setResetConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    getUpcomingLessons(3).then(setUpcomingLessons)
    getAllStudents().then((list) => setStudentCount(list.length))
    getThisWeekStats().then(setWeekStats)
    getThisMonthStats().then(setMonthStats)
    getThisWeekIncome().then(setWeekIncome)
    getThisMonthIncome().then(setMonthIncome)
  }

  useEffect(() => {
    load()
  }, [])

  const isLoading =
    upcomingLessons === null ||
    studentCount === null ||
    weekStats === null ||
    monthStats === null ||
    weekIncome === null ||
    monthIncome === null

  // 按日期分组课程
  const groupedByDate =
    upcomingLessons?.reduce<Record<string, Lesson[]>>((acc, lesson) => {
      const date = extractDate(lesson.startTime)
      if (!acc[date]) acc[date] = []
      acc[date].push(lesson)
      return acc
    }, {}) ?? {}

  // ── 导出数据 ──
  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const now = new Date()
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      a.download = `吉他教室_数据备份_${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('导出失败: ' + err.message)
    }
  }

  // ── 导入数据 ──
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportStatus('idle')
    setImportMsg('')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // 基本校验
      if (!data.students || !data.lessons || !data.materials) {
        throw new Error('备份文件格式不正确，缺少必要的数据表')
      }

      const totalCount = data.students.length + data.lessons.length + data.materials.length
      if (!confirm(
        `即将导入以下数据：\n\n` +
        `📋 学生档案：${data.students.length} 条\n` +
        `📅 上课日历：${data.lessons.length} 条\n` +
        `📁 课件汇总：${data.materials.length} 条\n\n` +
        `⚠️ 导入将覆盖当前所有数据，此操作不可撤销。确定继续吗？`
      )) {
        setImportStatus('idle')
        // reset file input
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      await importAllData(data)
      setImportStatus('success')
      setImportMsg(`成功导入 ${totalCount} 条数据`)
      load() // 刷新页面数据

      // 3秒后清除状态
      setTimeout(() => {
        setImportStatus('idle')
        setImportMsg('')
      }, 4000)
    } catch (err: any) {
      setImportStatus('error')
      setImportMsg(err.message || '导入失败，请检查文件格式')
      setTimeout(() => {
        setImportStatus('idle')
        setImportMsg('')
      }, 5000)
    }

    // reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── 重置演示数据 ──
  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 5000) // 5秒后自动取消确认状态
      return
    }
    try {
      await resetToSeedData()
      setImportStatus('success')
      setImportMsg('已重置为演示数据（8位学生、60+节课程、20项课件）')
      setResetConfirm(false)
      load()
      setTimeout(() => {
        setImportStatus('idle')
        setImportMsg('')
      }, 4000)
    } catch (err: any) {
      setImportStatus('error')
      setImportMsg('重置失败: ' + err.message)
      setTimeout(() => {
        setImportStatus('idle')
        setImportMsg('')
      }, 5000)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 顶部欢迎区 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">首页看板</h2>
        <p className="mt-1 text-sm text-slate-500">
          欢迎回来，以下是今日的教学概览
        </p>
      </div>

      {/* 统计卡片行 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="最近3天课程"
          value={upcomingLessons?.length ?? '-'}
          subtitle="待上课"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="本周课时"
          value={weekStats != null ? `${weekStats} 课时` : '-'}
          subtitle="已完成"
          icon={CalendarDays}
          color="green"
        />
        <StatCard
          title="本月课时"
          value={monthStats != null ? `${monthStats} 课时` : '-'}
          subtitle="已完成"
          icon={CalendarDays}
          color="blue"
        />
        <StatCard
          title="本周收入"
          value={weekIncome != null ? `¥${weekIncome}` : '-'}
          subtitle="已上课收入"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="本月收入"
          value={monthIncome != null ? `¥${monthIncome}` : '-'}
          subtitle="已上课收入"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="学生总数"
          value={studentCount ?? '-'}
          subtitle="在读学生"
          icon={Users}
          color="blue"
          onClick={() => navigate('/students')}
        />
      </div>

      {/* 加载中 */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-400">加载数据中…</span>
        </div>
      )}

      {/* 最近3天课程 - 全宽 */}
      {!isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-blue-600" />
              最近3天课程
            </h3>
            <span className="text-xs text-slate-400">
              共 {upcomingLessons!.length} 节
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingLessons && upcomingLessons.length > 0 ? (
              Object.entries(groupedByDate).map(([date, items]) => (
                <div key={date}>
                  <div className="bg-slate-50/50 px-5 py-2">
                    <span className="text-xs font-medium text-slate-500">
                      {getDateLabel(date)} · {date}
                    </span>
                  </div>
                  {items.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => { window.location.href = '/calendar' }}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-50/50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                          {lesson.studentName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {lesson.studentName}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              lesson.lessonType === '试听课' ? 'bg-amber-50 text-amber-700' :
                              lesson.lessonType === '正式课多节' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {lesson.lessonType || '正式课单节'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {extractTime(lesson.startTime)} · {lesson.duration} 课时
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.income > 0 && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            ¥{lesson.income}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                未来3天暂无课程安排
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 数据管理 ── */}
      {!isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Database className="h-4 w-4 text-slate-600" />
              数据管理
            </h3>
            <span className="text-xs text-slate-400">备份与恢复</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-slate-500 mb-4">
              将本地数据导出为 JSON 文件备份，或从备份文件恢复数据。导入将覆盖当前所有数据。
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {/* 导出按钮 */}
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                导出数据备份
              </button>

              {/* 导入按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                导入数据恢复
              </button>

              {/* 重置按钮 */}
              <button
                onClick={handleReset}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  resetConfirm
                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                {resetConfirm ? '确认重置所有数据?' : '重置演示数据'}
              </button>
            </div>

            {/* 导入状态提示 */}
            {importMsg && (
              <div
                className={`mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                  importStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : importStatus === 'error'
                      ? 'bg-red-50 text-red-700'
                      : ''
                }`}
              >
                {importStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                {importStatus === 'error' && <AlertTriangle className="h-4 w-4" />}
                {importMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
