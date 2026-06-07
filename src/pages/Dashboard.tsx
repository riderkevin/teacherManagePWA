import { useEffect, useState } from 'react'
import {
  Clock,
  BookOpen,
  CalendarDays,
  Users,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  getAllStudents,
  getUpcomingLessons,
  getThisWeekStats,
  getThisMonthStats,
} from '../db/database'
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
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[] | null>(null)
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [weekStats, setWeekStats] = useState<number | null>(null)
  const [monthStats, setMonthStats] = useState<number | null>(null)

  useEffect(() => {
    getUpcomingLessons(3).then(setUpcomingLessons)
    getAllStudents().then((list) => setStudentCount(list.length))
    getThisWeekStats().then(setWeekStats)
    getThisMonthStats().then(setMonthStats)
  }, [])

  const isLoading =
    upcomingLessons === null ||
    studentCount === null ||
    weekStats === null ||
    monthStats === null

  // 按日期分组课程
  const groupedByDate =
    upcomingLessons?.reduce<Record<string, Lesson[]>>((acc, lesson) => {
      const date = extractDate(lesson.startTime)
      if (!acc[date]) acc[date] = []
      acc[date].push(lesson)
      return acc
    }, {}) ?? {}

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="最近3天课程"
          value={upcomingLessons?.length ?? '-'}
          subtitle="待上课"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="本周课时"
          value={weekStats != null ? `${weekStats} 节` : '-'}
          subtitle="已完成"
          icon={CalendarDays}
          color="green"
        />
        <StatCard
          title="本月课时"
          value={monthStats != null ? `${monthStats} 节` : '-'}
          subtitle="已完成"
          icon={CalendarDays}
          color="blue"
        />
        <StatCard
          title="学生总数"
          value={studentCount ?? '-'}
          subtitle="在读学生"
          icon={Users}
          color="blue"
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
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                          {lesson.studentName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {lesson.studentName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {extractTime(lesson.startTime)} · {lesson.duration} 课时
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
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
    </div>
  )
}
