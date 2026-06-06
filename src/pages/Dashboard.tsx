import {
  Clock,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChevronRight,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  getUpcomingLessons,
  getRenewalStudents,
  getThisWeekStats,
  getThisMonthStats,
} from '../data/mockData'

export default function Dashboard() {
  const upcomingLessons = getUpcomingLessons(3)
  const renewalStudents = getRenewalStudents()
  const weekStats = getThisWeekStats()
  const monthStats = getThisMonthStats()

  // 按日期分组课程
  const groupedByDate = upcomingLessons.reduce<Record<string, typeof upcomingLessons>>((acc, lesson) => {
    if (!acc[lesson.date]) acc[lesson.date] = []
    acc[lesson.date].push(lesson)
    return acc
  }, {})

  const dateLabels: Record<string, string> = {
    '2026-06-06': '今天',
    '2026-06-07': '明天',
    '2026-06-08': '后天',
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="最近3天课程"
          value={upcomingLessons.length}
          subtitle="待上课"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="本周课时"
          value={`${weekStats} 节`}
          subtitle="已完成"
          icon={CalendarDays}
          color="green"
        />
        <StatCard
          title="本月课时"
          value={`${monthStats} 节`}
          subtitle="已完成"
          icon={CalendarDays}
          color="blue"
        />
        <StatCard
          title="待续费学生"
          value={renewalStudents.length}
          subtitle="剩余课时 ≤ 3 或已过期"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* 主要内容区域：两列 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左列：最近3天课程 */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-blue-600" />
              最近3天课程
            </h3>
            <span className="text-xs text-slate-400">
              共 {upcomingLessons.length} 节
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date}>
                <div className="bg-slate-50/50 px-5 py-2">
                  <span className="text-xs font-medium text-slate-500">
                    {dateLabels[date] || date} · {date}
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
                          {lesson.time} · {lesson.duration} 课时
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                ))}
              </div>
            ))}
            {upcomingLessons.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                未来3天暂无课程安排
              </div>
            )}
          </div>
        </div>

        {/* 右列：续费提醒 */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              续费提醒
            </h3>
            <span className="text-xs text-slate-400">
              {renewalStudents.length} 位学生
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {renewalStudents.map((student) => {
              const isExpired = student.status === 'expired'
              const isExpiring = student.status === 'expiring'
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                        isExpired
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {student.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        续费日 {student.nextRenewalDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isExpired
                          ? 'bg-red-50 text-red-600'
                          : isExpiring
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {isExpired
                        ? '已过期'
                        : `剩余 ${student.remainingHours} 课时`}
                    </span>
                  </div>
                </div>
              )
            })}
            {renewalStudents.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                暂无待续费学生
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
