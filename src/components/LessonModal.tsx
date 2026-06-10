import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import type { Lesson, LessonStatus, LessonType, Student } from '../types'
import { getStudentDisplayName, calcEndTime, extractMonth, extractWeek, inferLessonType } from '../types'
import { getAllStudents, getLessonsByStudentId } from '../api'

// ── 常量 ──
const STATUS_OPTIONS: LessonStatus[] = ['未上课', '已上课', '放鸽子']
const LESSON_TYPE_OPTIONS: LessonType[] = ['试听课', '正式课单节', '正式课多节']
const LESSON_TYPE_STYLE: Record<LessonType, string> = {
  '试听课': 'bg-amber-50 text-amber-700 border-amber-200',
  '正式课单节': 'bg-blue-50 text-blue-700 border-blue-200',
  '正式课多节': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

// 套餐标签构建器选项
const PERIODS = ['一期', '二期', '三期', '四期', '五期']
const PACK_SIZES = ['5节', '10节', '20节', '30节']
const BONUSES = ['', '赠1节', '赠2节', '赠3节', '赠4节', '赠5节']

/** 计算新课程对应的课时编号后缀（基于已完成的正式课） */
function computeLessonSuffix(existingLessons: Lesson[], duration: number, excludeLessonId?: number): string {
  const before = existingLessons
    .filter((l) => l.status === '已上课' && l.lessonType !== '试听课' && l.id !== excludeLessonId)
    .reduce((sum, l) => sum + l.duration, 0)

  if (duration === 1) return `课时${before + 1}`

  const numbers: number[] = []
  for (let i = 0; i < duration; i++) {
    numbers.push(before + i + 1)
  }
  return `课时${numbers.join('、')}`
}

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
  income: 0,
  lessonType: '正式课单节',
  packageLabel: '',
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
  const [studentLessons, setStudentLessons] = useState<Lesson[]>([])

  // 日期时间拆分
  const [datePart, setDatePart] = useState('')
  const [hourPart, setHourPart] = useState('14')
  const [minutePart, setMinutePart] = useState('00')

  // 套餐标签构建器
  const [buildPeriod, setBuildPeriod] = useState('')
  const [buildPack, setBuildPack] = useState('')
  const [buildBonus, setBuildBonus] = useState('')
  const [showBuilder, setShowBuilder] = useState(false)

  // 学生历史套餐标签
  const savedLabels = useMemo(() => {
    const seen = new Set<string>()
    return studentLessons
      .filter((l) => l.lessonType === '正式课多节' && l.packageLabel)
      .map((l) => l.packageLabel)
      .filter((label) => {
        if (seen.has(label)) return false
        seen.add(label)
        return true
      })
  }, [studentLessons])

  // 构建器生成标签
  const builtLabel = useMemo(() => {
    if (!buildPeriod || !buildPack) return ''
    const bonus = buildBonus || ''
    return `正式课${buildPeriod}-${buildPack}一付${bonus}`
  }, [buildPeriod, buildPack, buildBonus])

  // 构建器变更 → 同步到表单
  useEffect(() => {
    if (showBuilder && builtLabel) update('packageLabel', builtLabel)
  }, [builtLabel, showBuilder])

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
      // 找到对应学生，并补充课时后缀（旧数据可能没有）
      if (data.studentId) {
        Promise.all([
          getAllStudents(),
          getLessonsByStudentId(data.studentId),
        ]).then(([list, existing]) => {
          setStudentLessons(existing)
          const s = list.find((s) => s.id === data.studentId)
          if (s) {
            setSelectedStudent(s)
            setStudentSearch(getStudentDisplayName(s))
            // 重新计算课时编号（动态调整）
            if (data.lessonType === '试听课') {
              setForm((prev) => ({ ...prev, title: `${data.studentName}-试听课` }))
            } else {
              const suffix = computeLessonSuffix(existing, data.duration, lesson?.id)
              setForm((prev) => ({
                ...prev,
                title: `${data.studentName}-正式课-${suffix}`,
              }))
            }
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
    const duration = Math.max(1, val)
    setForm((prev) => {
      let newTitle = prev.title
      // 仅正式课更新课时编号
      if (prev.lessonType !== '试听课') {
        const excludeId = isEdit ? lesson?.id : undefined
        const suffix = computeLessonSuffix(studentLessons, duration, excludeId)
        const baseTitle = prev.title.replace(/-课时[\d、]+$/, '')
        newTitle = `${baseTitle}-${suffix}`
      }
      return {
        ...prev,
        duration,
        endTime: prev.startTime ? calcEndTime(prev.startTime, duration) : prev.endTime,
        title: newTitle,
      }
    })
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

  const selectStudent = async (s: Student) => {
    const displayName = getStudentDisplayName(s)
    const defaultType = inferLessonType(s.status)
    const defaultIncome = defaultType === '试听课'
      ? s.trialPrice
      : defaultType === '正式课单节'
        ? s.singlePrice
        : 0

    // 获取该学生已有课程
    const existing = isEdit ? await getLessonsByStudentId(s.id!) : await getLessonsByStudentId(s.id!)
    setStudentLessons(existing)
    const excludeId = isEdit ? lesson?.id : undefined

    // 试听课不加课时编号
    const isTrial = defaultType === '试听课'
    const suffix = isTrial ? '' : `-${computeLessonSuffix(existing, 1, excludeId)}`

    // 重置构建器状态
    setBuildPeriod('')
    setBuildPack('')
    setBuildBonus('')
    setShowBuilder(false)

    setSelectedStudent(s)
    setStudentSearch(displayName)
    setDropdownOpen(false)
    setForm((prev) => ({
      ...prev,
      studentId: s.id!,
      studentName: displayName,
      title: `${displayName}-${isTrial ? '试听课' : '正式课'}${suffix}`,
      lessonType: defaultType,
      income: defaultIncome,
      packageLabel: '',
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
            <span className="text-sm font-medium text-slate-700">时长（小时 / 课时）</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDurationChange(form.duration - 1)}
                disabled={form.duration <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={form.duration}
                onChange={(e) => handleDurationChange(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleDurationChange(form.duration + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                +
              </button>
              <span className="text-sm text-slate-400">
                {form.duration > 0 ? `${form.duration} 课时` : '1 课时'}
              </span>
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

          {/* 课程类型 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              课程类型 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {LESSON_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    update('lessonType', t)
                    // 切换类型时重置收入 + 更新标题
                    if (t === '正式课多节') {
                      update('income', 0)
                    } else if (selectedStudent) {
                      update('income', t === '试听课' ? selectedStudent.trialPrice : selectedStudent.singlePrice)
                    }
                    // 更新标题：试听课不加课时编号，正式课加上
                    const excludeId = isEdit ? lesson?.id : undefined
                    if (t === '试听课') {
                      if (selectedStudent) {
                        update('title', `${getStudentDisplayName(selectedStudent)}-试听课`)
                      }
                    } else {
                      const suffix = computeLessonSuffix(studentLessons, form.duration, excludeId)
                      const base = form.title.replace(/-试听课$/, '').replace(/-正式课-课时[\d、]+$/, '')
                      update('title', `${base}-正式课-${suffix}`)
                    }
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    form.lessonType === t
                      ? LESSON_TYPE_STYLE[t] + ' border-current'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 正式课多节：套餐标签 */}
          {form.lessonType === '正式课多节' && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-sm font-medium text-slate-700">套餐标签</span>

              {/* 历史标签快捷选择 */}
              {savedLabels.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-400">选择已有标签</span>
                  <div className="flex flex-wrap gap-2">
                    {savedLabels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          update('packageLabel', label)
                          setShowBuilder(false)
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          form.packageLabel === label && !showBuilder
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 自定义组合构建器 */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowBuilder(!showBuilder)}
                  className={`text-xs font-medium transition-colors ${
                    showBuilder ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  {showBuilder ? '▾ 收起自定义组合' : '▸ 自定义组合新标签'}
                </button>

                {showBuilder && (
                  <div className="space-y-2 bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={buildPeriod}
                        onChange={(e) => setBuildPeriod(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">期数</option>
                        {PERIODS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <select
                        value={buildPack}
                        onChange={(e) => setBuildPack(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">N节一付</option>
                        {PACK_SIZES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <select
                        value={buildBonus}
                        onChange={(e) => setBuildBonus(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">赠课(无)</option>
                        {BONUSES.filter(Boolean).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    {builtLabel && (
                      <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5 font-medium">
                        预览：{builtLabel}
                      </p>
                    )}
                    {!buildPeriod && !buildPack && (
                      <p className="text-xs text-slate-400">选择期数、节数和赠课后自动生成标签</p>
                    )}
                  </div>
                )}
              </div>

              {/* 手动编辑 */}
              <input
                type="text"
                value={form.packageLabel}
                onChange={(e) => {
                  update('packageLabel', e.target.value)
                  setShowBuilder(false)
                }}
                placeholder="或直接手动输入套餐标签…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <p className="text-xs text-slate-400">
                用于计算当前套餐剩余课时，格式如：正式课一期-10节一付赠2节
              </p>
            </div>
          )}

          {/* 课时收入（试听课/正式课单节 且 已上课时显示） */}
          {form.lessonType !== '正式课多节' && form.status === '已上课' && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                课时收入（元）
                {selectedStudent && form.lessonType === '试听课' && selectedStudent.trialPrice > 0 && (
                  <span className="text-xs text-slate-400 ml-1">（试听课价格 ¥{selectedStudent.trialPrice}）</span>
                )}
                {selectedStudent && form.lessonType === '正式课单节' && selectedStudent.singlePrice > 0 && (
                  <span className="text-xs text-slate-400 ml-1">（单次价格 ¥{selectedStudent.singlePrice}）</span>
                )}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.income || 0}
                onChange={(e) => update('income', Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          )}

          {/* 正式课多节时：提示收入在缴费记录中管理 */}
          {form.lessonType === '正式课多节' && form.status === '已上课' && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
              💡 正式课多节的收入在「学生档案 → 缴费记录」中统一管理，此处不计收入。
            </div>
          )}

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
