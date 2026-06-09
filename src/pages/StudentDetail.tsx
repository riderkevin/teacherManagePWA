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
  DollarSign,
  CreditCard,
  Plus,
  Trash2,
  Paperclip,
  Copy,
  Check,
} from 'lucide-react'
import {
  getStudentById,
  getLessonsByStudentId,
  updateStudent,
  getPaymentsByStudentId,
  addPayment,
  updatePayment,
  deletePayment,
  getStudentPackageStats,
  getLessonMaterials,
} from '../api'
import { getStudentDisplayName, computeProgress } from '../types'
import type { Student, Lesson, LessonMaterial, Payment } from '../types'
import StudentModal from '../components/StudentModal'
import PaymentModal from '../components/PaymentModal'
import LessonMaterialModal from '../components/LessonMaterialModal'
import RadarChart from '../components/RadarChart'
import { generateBindCode, getBindingStatus, unbindStudent } from '../api/wx'

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

  // 缴费记录
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [pkgStats, setPkgStats] = useState<{ totalPaid: number; currentPackageLabel: string; currentRemaining: number } | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | null>(null)
  const [materialModalLesson, setMaterialModalLesson] = useState<Lesson | null>(null)
  const [lessonMaterialsMap, setLessonMaterialsMap] = useState<Map<number, LessonMaterial[]>>(new Map())
  const [copied, setCopied] = useState(false)

  // 微信绑定状态
  const [bindStatus, setBindStatus] = useState<{ isBound: boolean; wxNickname?: string; boundAt?: string } | null>(null)
  const [bindCode, setBindCode] = useState<string | null>(null)
  const [bindLoading, setBindLoading] = useState(false)

  const load = async () => {
    if (!id) return
    const sid = Number(id)
    const [s, l, p, pkg] = await Promise.all([
      getStudentById(sid),
      getLessonsByStudentId(sid),
      getPaymentsByStudentId(sid),
      getStudentPackageStats(sid),
    ])
    setStudent(s ?? null)
    setLessons(l)
    setPayments(p)
    setPkgStats(pkg)

    // 加载所有课程附件
    const matsMap = new Map<number, LessonMaterial[]>()
    await Promise.all(l.map(async (lesson) => {
      if (lesson.id) {
        const mats = await getLessonMaterials(lesson.id)
        if (mats.length > 0) matsMap.set(lesson.id, mats)
      }
    }))
    setLessonMaterialsMap(matsMap)

    // 加载绑定状态
    getBindingStatus(sid).then(setBindStatus).catch(() => setBindStatus(null))
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
    const totalIncome = lessons.reduce((sum, l) => sum + (l.income || 0), 0)

    return { total, completed, upcoming, noShow, lastLessonDate, avgPerMonth, totalHours, totalIncome }
  }, [lessons])

  // 编辑学生
  const handleEdit = async (data: Omit<Student, 'id'>) => {
    if (!student?.id) return
    await updateStudent(student.id, data)
    setEditOpen(false)
    load()
  }

  // 缴费记录操作
  const handleAddPayment = async (data: Omit<Payment, 'id'>) => {
    await addPayment(data)
    setPaymentModalOpen(false)
    load()
  }

  const handleEditPayment = async (data: Omit<Payment, 'id'>) => {
    if (!editingPayment?.id) return
    await updatePayment(editingPayment.id, data)
    setEditingPayment(null)
    load()
  }

  const handleDeletePayment = async () => {
    if (!deletePaymentTarget?.id) return
    await deletePayment(deletePaymentTarget.id)
    setDeletePaymentTarget(null)
    load()
  }

  // ── 复制课件汇总 ──
  /** 生成单节课的课件文本 */
  const generateLessonText = (lesson: Lesson, mats: LessonMaterial[]): string => {
    // 日期：2026/05/08 → 260508
    const datePart = lesson.startTime.split(' ')[0]
    const [y, m, d] = datePart.split('/')
    const shortDate = `${String(y).slice(2)}${m}${d}`

    // 从标题提取课时后缀："赵一鸣-正式课-课时11、12" → "课时11、12"
    const keciMatch = lesson.title.match(/课时[\d、]+/)
    const keci = keciMatch ? keciMatch[0] : ''

    const lines: string[] = []
    lines.push(`${shortDate}-${keci}`)

    mats.forEach((m, i) => {
      const body = m.materialId ? m.text : m.fileData ? m.fileName : m.text
      lines.push(`${i + 1}. ${body}`)
      // 只有真实 URL（http/https）才作为可点击链接；base64 dataURL 跳过
      if (m.fileLink && /^https?:\/\//.test(m.fileLink)) {
        lines.push(`   ${m.fileLink}`)
      }
    })

    return lines.join('\n')
  }

  /** 生成全部课程汇总 */
  const generateSummary = (): string => {
    if (!lessons || !student) return ''
    const sorted = [...lessons]
      .filter((l) => l.status !== '放鸽子')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    const lines: string[] = []
    const now = new Date()
    lines.push(`${displayName} · 课件汇总  更新于 ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`)
    lines.push('')

    for (const lesson of sorted) {
      const mats = lesson.id ? (lessonMaterialsMap.get(lesson.id) || []) : []
      lines.push(generateLessonText(lesson, mats))
      lines.push('')
    }

    const totalMats = Array.from(lessonMaterialsMap.values()).reduce((sum, m) => sum + m.length, 0)
    lines.push(`---`)
    lines.push(`共 ${sorted.length} 节课 · ${sorted.reduce((s, l) => s + l.duration, 0)} 课时 · ${totalMats} 条课件`)

    return lines.join('\n')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopySummary = async () => {
    await copyToClipboard(generateSummary())
  }

  const handleCopyLesson = async (lesson: Lesson) => {
    const mats = lesson.id ? (lessonMaterialsMap.get(lesson.id) || []) : []
    await copyToClipboard(generateLessonText(lesson, mats))
  }

  // 微信绑定操作
  const handleGenerateCode = async () => {
    if (!student?.id) return
    setBindLoading(true)
    try {
      const result = await generateBindCode(student.id)
      setBindCode(result.code)
    } catch (err: any) {
      alert(err.message || '生成失败')
    } finally {
      setBindLoading(false)
    }
  }

  const handleUnbind = async () => {
    if (!student?.id) return
    if (!confirm(`确定要解除 ${displayName} 的小程序绑定吗？解除后学生将无法查看自己的数据。`)) return
    try {
      await unbindStudent(student.id)
      setBindStatus({ isBound: false })
    } catch (err: any) {
      alert(err.message || '解绑失败')
    }
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
            <InfoRow label="目前进度" value={lessons ? computeProgress(lessons) : '加载中…'} />
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
                  value={`${stats.completed} 节 (${stats.totalHours}课时)`}
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
                <StatRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  label="累计收入"
                  value={`¥${stats.totalIncome}`}
                />
              </div>
            </div>
          )}

          {/* 微信小程序绑定 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .178-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
              </svg>
              学生小程序
            </h3>

            {bindStatus === null ? (
              <p className="text-xs text-slate-400">加载中…</p>
            ) : bindStatus.isBound ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-medium">已绑定</span>
                </div>
                {bindStatus.wxNickname && (
                  <p className="text-xs text-slate-500">微信昵称: {bindStatus.wxNickname}</p>
                )}
                {bindStatus.boundAt && (
                  <p className="text-xs text-slate-400">绑定时间: {bindStatus.boundAt.split('T')[0]}</p>
                )}
                <button
                  onClick={handleUnbind}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  解除绑定
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="text-slate-500 font-medium">未绑定</span>
                </div>
                <p className="text-xs text-slate-400">
                  生成绑定码，发送给学生。学生在小程序中输入绑定码即可关联。
                </p>

                {bindCode ? (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-center">
                      <p className="text-xs text-emerald-600 mb-1">绑定码（发给学生）</p>
                      <p className="text-2xl font-bold tracking-widest text-emerald-700 font-mono">
                        {bindCode}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bindCode)
                        alert('已复制绑定码')
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      复制绑定码
                    </button>
                    <button
                      onClick={() => {
                        setBindCode(null)
                        load()
                      }}
                      className="w-full rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      刷新状态
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateCode}
                    disabled={bindLoading}
                    className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {bindLoading ? '生成中…' : '生成绑定码'}
                  </button>
                )}
              </div>
            )}
          </div>
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">共 {lessons.length} 节</span>
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    复制课件汇总
                  </>
                )}
              </button>
            </div>
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
                const mats = lesson.id ? lessonMaterialsMap.get(lesson.id) || [] : []
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{lesson.title}</p>
                      <p className="text-xs text-slate-400">
                        {lesson.startTime} → {lesson.endTime} · {lesson.duration}课时
                      </p>
                      {/* 课件摘要 */}
                      {mats.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {mats.slice(0, 2).map((m) => (
                            <span key={m.id} className="inline-flex items-center gap-0.5 text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 max-w-[200px] truncate">
                              <Paperclip className="h-2.5 w-2.5 flex-shrink-0" />
                              {m.materialId ? m.text : m.fileData ? m.fileName : m.text}
                            </span>
                          ))}
                          {mats.length > 2 && (
                            <span className="text-xs text-slate-400">+{mats.length - 2}条</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      {lesson.income > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                          <DollarSign className="h-3 w-3" />
                          {lesson.income}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyLesson(lesson) }}
                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="复制本节课件"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMaterialModalLesson(lesson) }}
                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="课件附件"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs text-slate-400 hidden sm:inline">{lesson.week}</span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusStyle}`}
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

      {/* ── 缴费记录 + 作品展示 ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 缴费记录 */}
        {payments !== null && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                缴费记录
              </h3>
              <button
                onClick={() => {
                  setEditingPayment(null)
                  setPaymentModalOpen(true)
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                新增
              </button>
            </div>

            {/* 套餐统计 */}
            {pkgStats && pkgStats.totalPaid > 0 && (
              <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-emerald-50/50 border-b border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-500">累计缴费</p>
                  <p className="text-sm font-semibold text-emerald-700">¥{pkgStats.totalPaid}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">当前套餐</p>
                  <p className="text-xs font-medium text-slate-700 truncate">{pkgStats.currentPackageLabel || '-'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">剩余课时</p>
                  <p className={`text-sm font-semibold ${pkgStats.currentRemaining > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {pkgStats.currentRemaining} 节
                  </p>
                </div>
              </div>
            )}

            {/* 缴费列表 */}
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {payments.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  暂无缴费记录
                </div>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{p.packageLabel}</span>
                        <span className="text-xs text-emerald-600 font-medium">¥{p.amount}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {p.date} · {p.lessonCount} 节
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={() => {
                          setEditingPayment(p)
                          setPaymentModalOpen(true)
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        title="编辑"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletePaymentTarget(p)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 作品展示（占位） */}
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

      {/* 缴费弹窗 */}
      {paymentModalOpen && student?.id && (
        <PaymentModal
          studentId={student.id}
          studentName={getStudentDisplayName(student)}
          payment={editingPayment}
          onSave={(data) => {
            if (editingPayment) {
              handleEditPayment(data)
            } else {
              handleAddPayment(data)
            }
          }}
          onClose={() => {
            setPaymentModalOpen(false)
            setEditingPayment(null)
          }}
        />
      )}

      {/* 课件附件弹窗 */}
      {materialModalLesson?.id && (
        <LessonMaterialModal
          lessonId={materialModalLesson.id}
          lessonTitle={materialModalLesson.title}
          onClose={() => setMaterialModalLesson(null)}
        />
      )}

      {/* 删除缴费确认 */}
      {deletePaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeletePaymentTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">确认删除</h4>
            <p className="mt-2 text-sm text-slate-500">
              确定要删除 <span className="font-medium text-slate-900">{deletePaymentTarget.packageLabel}</span>（¥{deletePaymentTarget.amount}）的缴费记录吗？
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletePaymentTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleDeletePayment}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

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
