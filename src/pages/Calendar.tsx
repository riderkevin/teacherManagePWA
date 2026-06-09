import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  Clock,
  User,
  Hourglass,
  DollarSign,
} from 'lucide-react'
import {
  getAllLessons,
  addLesson,
  updateLesson,
  deleteLesson,
  getLessonMonths,
} from '../api'
import type { Lesson } from '../types'
import LessonModal from '../components/LessonModal'

// ── 状态配色 ──
const STATUS_STYLE: Record<string, string> = {
  '未上课': 'bg-blue-50 text-blue-700',
  '已上课': 'bg-emerald-50 text-emerald-700',
  '放鸽子': 'bg-slate-100 text-slate-500',
}

const LESSON_TYPE_STYLE: Record<string, string> = {
  '试听课': 'bg-amber-50 text-amber-700',
  '正式课单节': 'bg-blue-50 text-blue-700',
  '正式课多节': 'bg-emerald-50 text-emerald-700',
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[] | null>(null)
  const [months, setMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)

  const load = async () => {
    const [all, mons] = await Promise.all([getAllLessons(), getLessonMonths()])
    setLessons(all)
    setMonths(mons)
    if (!selectedMonth && mons.length > 0) {
      setSelectedMonth(mons[0])
    }
  }

  useEffect(() => {
    load()
  }, [])

  // 按选中月份过滤 + 按周分组
  const groupedByWeek = useMemo(() => {
    if (!lessons || !selectedMonth) return []
    const filtered = lessons
      .filter((l) => l.month === selectedMonth)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    const map = new Map<string, Lesson[]>()
    for (const l of filtered) {
      const arr = map.get(l.week) || []
      arr.push(l)
      map.set(l.week, arr)
    }
    return [...map.entries()]
  }, [lessons, selectedMonth])

  // 新增
  const handleAdd = async (data: Omit<Lesson, 'id'>) => {
    await addLesson(data)
    setModalOpen(false)
    load()
  }

  // 编辑
  const handleEdit = async (data: Omit<Lesson, 'id'>) => {
    if (!editingLesson?.id) return
    await updateLesson(editingLesson.id, data)
    setEditingLesson(null)
    load()
  }

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await deleteLesson(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  // 解析 startTime 提取时间部分 HH:MM
  const timeOnly = (startTime: string) => {
    const parts = startTime.split(' ')
    return parts[1] || startTime
  }

  // 解析 startTime 提取日期部分 MM/DD
  const dateOnly = (startTime: string) => {
    const parts = startTime.split(' ')
    const [, m, d] = (parts[0] || '').split('/')
    return `${m}/${d}`
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 顶部 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">上课日历</h2>
          <p className="mt-1 text-sm text-slate-500">
            {lessons ? `共 ${lessons.length} 节课程` : '加载中…'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLesson(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          新增日程
        </button>
      </div>

      {/* 加载 */}
      {lessons === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-400">加载中…</span>
        </div>
      )}

      {/* 空状态 */}
      {lessons?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <CalendarDays className="h-16 w-16 mb-4" />
          <p className="text-sm">还没有课程安排</p>
          <button
            onClick={() => {
              setEditingLesson(null)
              setModalOpen(true)
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            添加第一节课程
          </button>
        </div>
      )}

      {/* 月份标签 */}
      {months.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedMonth === m
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m}
              <span className={`ml-1.5 text-xs ${
                selectedMonth === m ? 'text-blue-200' : 'text-slate-400'
              }`}>
                ({lessons?.filter((l) => l.month === m).length || 0})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 按周分组的课程列表 */}
      {selectedMonth && groupedByWeek.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">
          该月份暂无课程
        </div>
      )}

      {groupedByWeek.map(([week, items]) => (
        <div key={week} className="space-y-3">
          {/* 周标题 */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{week}</span>
            <span className="text-xs text-slate-400">{items.length} 节</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* 课程卡片 */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => navigate(`/students/${lesson.studentId}`)}
              >
                {/* 标题 + 状态 */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {lesson.title}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${LESSON_TYPE_STYLE[lesson.lessonType] || 'bg-slate-50 text-slate-500'}`}
                    >
                      {lesson.lessonType || '正式课单节'}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLE[lesson.status]}`}
                    >
                      {lesson.status}
                    </span>
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{lesson.studentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{dateOnly(lesson.startTime)} {timeOnly(lesson.startTime)} → {timeOnly(lesson.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hourglass className="h-3.5 w-3.5 text-slate-400" />
                    <span>{lesson.duration} 课时</span>
                    {lesson.income > 0 && (
                      <>
                        <span className="text-slate-300">|</span>
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">¥{lesson.income}</span>
                      </>
                    )}
                  </div>
                  {lesson.lessonType === '正式课多节' && lesson.packageLabel && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 inline-block">
                      {lesson.packageLabel}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div
                  className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setEditingLesson(lesson)
                      setModalOpen(true)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 新增/编辑弹窗 */}
      {modalOpen && (
        <LessonModal
          lesson={editingLesson}
          onSave={(data) => {
            if (editingLesson) {
              handleEdit(data)
            } else {
              handleAdd(data)
            }
          }}
          onClose={() => {
            setModalOpen(false)
            setEditingLesson(null)
          }}
        />
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">确认删除</h4>
            <p className="mt-2 text-sm text-slate-500">
              确定要删除 <span className="font-medium text-slate-900">{deleteTarget.title}</span> 吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
