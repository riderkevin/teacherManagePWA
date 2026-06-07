import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  Music,
  Target,
  TrendingUp,
  Mic,
  FileMusic,
} from 'lucide-react'
import { getStudentById, getLessonsByStudentId, updateStudent } from '../db/database'
import { getStudentDisplayName } from '../types'
import type { Student, Lesson } from '../types'
import StudentModal from '../components/StudentModal'
import RadarChart from '../components/RadarChart'

// ── 示例雷达图维度（后续可从 Student 字段读取实际数据） ──
const SAMPLE_DIMENSIONS = [
  { label: '技法', value: 7 },
  { label: '乐理', value: 5 },
  { label: '节奏感', value: 6 },
  { label: '即兴', value: 4 },
  { label: '视奏', value: 5 },
  { label: '创作', value: 3 },
]

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null | undefined>(undefined) // undefined=loading, null=not found
  const [lessons, setLessons] = useState<Lesson[] | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = async () => {
    if (!id) return
    const [s, l] = await Promise.all([
      getStudentById(Number(id)),
      getLessonsByStudentId(Number(id)),
    ])
    setStudent(s ?? null)
    setLessons(l)
  }

  useEffect(() => {
    load()
  }, [id])

  // ── 统计数据 ──
  const stats = useMemo(() => {
    if (!lessons) return null
    const total = lessons.length
    const completed = lessons.filter((l) => l.status === '已上课').length
    const upcoming = lessons.filter((l) => l.status === '未上课').length
    const noShow = lessons.filter((l) => l.status === '放鸽子').length

    // 最近一次上课日期（已完成的）
    const completedLessons = lessons
      .filter((l) => l.status === '已上课')
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
    const lastLessonDate = completedLessons[0]?.startTime?.split(' ')[0] || '-'

    // 上课频率（每月平均）
    const monthSet = new Set(lessons.map((l) => l.month))
    const avgPerMonth = monthSet.size > 0 ? (completed / monthSet.size).toFixed(1) : '0'

    // 总课时（已完成时长）
    const totalHours = completedLessons.reduce((sum, l) => sum + l.duration, 0)

    return { total, completed, upcoming, noShow, lastLessonDate, avgPerMonth, totalHours }
  }, [lessons])

  // 编辑学生
  const handleEdit = async (data: Omit<Student, 'id'>) => {
    if (!student?.id) return
    await updateStudent(student.id, data)
    setEditOpen(false)
    load()
  }

  // 加载中
  if (student === undefined) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-slate-400">加载中…</span>
      </div>
    )
  }

  // 未找到
  if (student === null) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <p className="text-lg font-medium">学生不存在</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          返回学生列表
        </button>
      </div>
    )
  }

  const displayName = getStudentDisplayName(student)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
            {student.isNotSelf && (
              <p className="text-sm text-slate-500">
                微信预约人：{student.wechatNickname} · 微信ID：{student.wechatId || '-'}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          编辑
        </button>
      </div>

      {/* ── 第一行：基本信息 + 雷达图 ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本信息卡片 */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            基本信息
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="微信昵称" value={student.wechatNickname} />
            <InfoRow label="微信ID" value={student.wechatId || '-'} />
            <InfoRow label="上课方式" value={student.isNotSelf ? '非本人 · 代约' : '本人上课'} />
            {student.isNotSelf && (
              <InfoRow label="实际学生姓名" value={student.actualStudentName || '-'} />
            )}
            <InfoRow label="目前状态" value={student.status} />
            <InfoRow label="目前进度" value={student.progress || '-'} />
            <InfoRow label="上课地点" value={student.location || '-'} />
            <InfoRow label="首节试听课" value={student.firstTrialDate || '-'} />
            <InfoRow
              label="文档链接"
              value={
                student.docLink ? (
                  <a
                    href={student.docLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    打开文档 →
                  </a>
                ) : (
                  '-'
                )
              }
            />
            <InfoRow label="器乐基础" value={student.instrumentBackground || '-'} />
            <InfoRow label="音乐偏好" value={student.musicPreference || '-'} />
          </div>

          {/* 价格 */}
          <h3 className="text-sm font-semibold text-slate-900 mt-5 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            课程价格
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <PriceBox label="试听课" value={student.trialPrice} />
            <PriceBox label="单次" value={student.singlePrice} />
            <PriceBox label="10次" value={student.tenPackPrice} />
            <PriceBox label="20次" value={student.twentyPackPrice} />
          </div>

          {/* 备注 */}
          {student.notes && (
            <>
              <h3 className="text-sm font-semibold text-slate-900 mt-5 mb-2">备注</h3>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{student.notes}</p>
            </>
          )}
        </div>

        {/* 雷达图 + 数据看板 */}
        <div className="space-y-6">
          {/* 多维能力图 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 text-center">
              学习维度评估
            </h3>
            <RadarChart dimensions={SAMPLE_DIMENSIONS} size={240} />
            <p className="text-xs text-slate-400 text-center mt-2">
              评估数据后续可编辑
            </p>
          </div>

          {/* 数据看板 */}
          {stats && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                数据看板
              </h3>
              <div className="space-y-3">
                <StatRow
                  icon={<Calendar className="h-4 w-4 text-blue-500" />}
                  label="最近上课"
                  value={stats.lastLessonDate}
                />
                <StatRow
                  icon={<Clock className="h-4 w-4 text-amber-500" />}
                  label="月均课时"
                  value={`${stats.avgPerMonth} 节/月`}
                />
                <StatRow
                  icon={<BookOpen className="h-4 w-4 text-emerald-500" />}
                  label="已完成"
                  value={`${stats.completed} 节 (${stats.totalHours}h)`}
                />
                <StatRow
                  icon={<Target className="h-4 w-4 text-purple-500" />}
                  label="待上课"
                  value={`${stats.upcoming} 节`}
                />
                <StatRow
                  icon={<Music className="h-4 w-4 text-slate-400" />}
                  label="放鸽子"
                  value={`${stats.noShow} 节`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 课程记录 ── */}
      {lessons && lessons.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-blue-600" />
              课程记录
            </h3>
            <span className="text-xs text-slate-400">共 {lessons.length} 节</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
            {[...lessons]
              .sort((a, b) => b.startTime.localeCompare(a.startTime))
              .map((lesson) => {
                const statusStyle =
                  lesson.status === '已上课'
                    ? 'bg-emerald-50 text-emerald-700'
                    : lesson.status === '放鸽子'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-blue-50 text-blue-700'
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lesson.title}</p>
                      <p className="text-xs text-slate-400">
                        {lesson.startTime} → {lesson.endTime} · {lesson.duration}h
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{lesson.week}</span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── 练习与作品展示（占位框架） ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 练习记录 */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Mic className="h-4 w-4 text-purple-500" />
            练习记录
          </h3>
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Music className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">练习记录模块即将上线</p>
            <p className="text-xs mt-1">可记录每日练习时长、练习内容、完成度</p>
          </div>
        </div>

        {/* 作品展示 */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileMusic className="h-4 w-4 text-amber-500" />
            作品展示
          </h3>
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Mic className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">作品展示模块即将上线</p>
            <p className="text-xs mt-1">可上传录音、视频、曲谱等</p>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editOpen && (
        <StudentModal
          student={student}
          onSave={handleEdit}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}

// ── 辅助小组件 ──

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  )
}

function PriceBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">
        {value > 0 ? `¥${value}` : '-'}
      </p>
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-slate-600">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}
