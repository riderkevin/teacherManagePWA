import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import type { Lesson, LessonStatus, Student } from '../types'
import { getStudentDisplayName, calcEndTime, extractMonth, extractWeek } from '../types'
import { getAllStudents } from '../db/database'

// ── 常量 ──
const STATUS_OPTIONS: LessonStatus[] = ['未上课', '已上课', '放鸽子']

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

type LessonFormData = Omit<Lesson, 'id'>

const EMPTY_FORM: LessonFormData = {
  title: '',
  studentId: 0,
  studentName: '',
  startTime: '',
  endTime: '',
  duration: 1,
  status: '未上课',
  month: '',
  week: '',
}

interface Props {
  lesson?: Lesson | null
  onSave: (data: LessonFormData) => void
  onClose: () => void
}

export default function LessonModal({ lesson, onSave, onClose }: Props) {
  const isEdit = !!lesson
  const [form, setForm] = useState<LessonFormData>(EMPTY_FORM)
  const [students, setStudents] = useState<Student[]>([])

  // 学生选择器状态
  const [studentSearch, setStudentSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 日期时间拆分
  const [datePart, setDatePart] = useState('')
  const [hourPart, setHourPart] = useState('14')
  const [minutePart, setMinutePart] = useState('00')

  // 加载学生列表
  useEffect(() => {
    getAllStudents().then(setStudents)
  }, [])

  // 初始化表单
  useEffect(() => {
    if (lesson) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = lesson
      setForm(data)
      // 解析 startTime
      const [dp, tp] = (data.startTime || '').split(' ')
      setDatePart(dp || '')
      if (tp) {
        const [h, m] = tp.split(':')
        setHourPart(h || '14')
        setMinutePart(m || '00')
      }
      // 找到对应学生
      if (data.studentId) {
        getAllStudents().then((list) => {
          const s = list.find((s) => s.id === data.studentId)
          if (s) {
            setSelectedStudent(s)
            setStudentSearch(getStudentDisplayName(s))
          }
        })
      }
    } else {
      setForm(EMPTY_FORM)
      setDatePart('')
      setHourPart('14')
      setMinutePart('00')
      setSelectedStudent(null)
      setStudentSearch('')
    }
  }, [lesson])

  const update = <K extends keyof LessonFormData>(key: K, value: LessonFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // 日期/时间变更 → 合成 startTime → 自动计算 month/week/endTime
  const updateDateTime = (dp: string, h: string, m: string) => {
    if (!dp) return
    const startTime = `${dp} ${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    const endTime = calcEndTime(startTime, form.duration)
    setForm((prev) => ({
      ...prev,
      startTime,
      endTime,
      month: extractMonth(startTime),
      week: extractWeek(startTime),
    }))
  }

  const handleDateChange = (val: string) => {
    setDatePart(val)
    updateDateTime(val, hourPart, minutePart)
  }

  const handleHourChange = (val: string) => {
    setHourPart(val)
    if (datePart) updateDateTime(datePart, val, minutePart)
  }

  const handleMinuteChange = (val: string) => {
    setMinutePart(val)
    if (datePart) updateDateTime(datePart, hourPart, val)
  }

  // 时长变更
  const handleDurationChange = (val: number) => {
    const duration = Math.max(0.5, val)
    setForm((prev) => ({
      ...prev,
      duration,
      endTime: prev.startTime ? calcEndTime(prev.startTime, duration) : prev.endTime,
    }))
  }

  // ── 学生选择器逻辑 ──
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students
    const q = studentSearch.toLowerCase()
    return students.filter((s) => {
      const display = getStudentDisplayName(s).toLowerCase()
      return (
        display.includes(q) ||
        s.wechatNickname.toLowerCase().includes(q) ||
        s.wechatId.toLowerCase().includes(q)
      )
    })
  }, [students, studentSearch])

  const selectStudent = (s: Student) => {
    const displayName = getStudentDisplayName(s)
    setSelectedStudent(s)
    setStudentSearch(displayName)
    setDropdownOpen(false)
    setForm((prev) => ({
      ...prev,
      studentId: s.id!,
      studentName: displayName,
      title: `吉他课-${displayName}`,
    }))
  }

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  // 将 YYYY/MM/DD 转为 YYYY-MM-DD 供 input[type=date] 使用
  const dateForInput = datePart ? datePart.replace(/\//g, '-') : ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑日程' : '新增日程'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 关联学生 */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-700">
              关联学生 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value)
                    setDropdownOpen(true)
                    setSelectedStudent(null)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="搜索学生名称、微信昵称、微信ID…"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <ChevronDown
                  className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
              </div>

              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      暂无匹配学生
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const displayName = getStudentDisplayName(s)
                      const isSelected = selectedStudent?.id === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => selectStudent(s)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors ${
                            isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900">
                              {displayName}
                            </span>
                            {s.isNotSelf ? (
                              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                代约
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                本人
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                            <span>微信: {s.wechatNickname}</span>
                            <span>ID: {s.wechatId || '-'}</span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 日程名称（自动生成） */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">日程名称</span>
            <input
              type="text"
              value={form.title}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
          </label>

          {/* 开始时间 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              开始时间 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* 日期 */}
              <div className="col-span-2">
                <input
                  type="date"
                  required
                  value={dateForInput}
                  onChange={(e) => handleDateChange(e.target.value.replace(/-/g, '/'))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {/* 小时 */}
              <select
                value={hourPart}
                onChange={(e) => handleHourChange(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {HOURS.map((h) => (
                  <option key={h} value={String(h).padStart(2, '0')}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            {/* 分钟选择 */}
            <div className="flex gap-2 pt-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteChange(String(m).padStart(2, '0'))}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    minutePart === String(m).padStart(2, '0')
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  :{String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            {form.startTime && (
              <p className="text-xs text-slate-400">
                格式: {form.startTime}（{form.week}）
              </p>
            )}
          </div>

          {/* 时长 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">时长（小时）</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDurationChange(form.duration - 0.5)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                −
              </button>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.duration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleDurationChange(form.duration + 0.5)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                +
              </button>
              <span className="text-sm text-slate-400">小时</span>
            </div>
          </label>

          {/* 结束时间（自动计算） */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">结束时间</span>
            <input
              type="text"
              value={form.endTime}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
          </label>

          {/* 当前状态 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">当前状态</span>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as LessonStatus)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {isEdit ? '保存修改' : '添加日程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
