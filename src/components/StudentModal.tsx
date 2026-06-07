import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Student, StudentStatus } from '../types'

const STATUS_OPTIONS: StudentStatus[] = [
  '正式课多节一付',
  '正式课单节一付',
  '仅上试听课',
  '未上课',
  '0号学生',
]

type StudentFormData = Omit<Student, 'id'>

const EMPTY_FORM: StudentFormData = {
  wechatNickname: '',
  wechatId: '',
  isNotSelf: false,
  actualStudentName: '',
  progress: '',
  docLink: '',
  location: '',
  trialPrice: 0,
  singlePrice: 0,
  tenPackPrice: 0,
  twentyPackPrice: 0,
  notes: '',
  firstTrialDate: '',
  status: '仅上试听课',
  instrumentBackground: '',
  musicPreference: '',
}

interface Props {
  student?: Student | null // null = 新增模式
  onSave: (data: StudentFormData) => void
  onClose: () => void
}

export default function StudentModal({ student, onSave, onClose }: Props) {
  const isEdit = !!student
  const [form, setForm] = useState<StudentFormData>(EMPTY_FORM)

  useEffect(() => {
    if (student) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = student
      setForm(data)
    } else {
      setForm(EMPTY_FORM)
    }
  }, [student])

  const update = <K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10">
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* 弹窗 */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑学生' : '新增学生'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ── 基本信息 ── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
              基本信息
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">
                  微信昵称 <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={form.wechatNickname}
                  onChange={(e) => update('wechatNickname', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如：吉他少年小王"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">微信ID</span>
                <input
                  type="text"
                  value={form.wechatId}
                  onChange={(e) => update('wechatId', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如：wxid_xxxx"
                />
              </label>
            </div>

            {/* 非本人上课 */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.isNotSelf}
                  onChange={(e) => update('isNotSelf', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-slate-700">非本人上课</span>
            </div>

            {form.isNotSelf && (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">
                  填学生名称 <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  required={form.isNotSelf}
                  value={form.actualStudentName}
                  onChange={(e) => update('actualStudentName', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="填写上课学生的姓名"
                />
              </label>
            )}
          </fieldset>

          {/* ── 课程信息 ── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
              课程信息
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">目前状态</span>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as StudentStatus)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">上课地点</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如：工作室 / 线上 / 学生家"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">目前进度（仅算正式课）</span>
              <input
                type="text"
                value={form.progress}
                onChange={(e) => update('progress', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：第8课 - CAGED系统"
              />
            </label>

            {/* 价格 */}
            <div className="grid gap-4 sm:grid-cols-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">试听课价格</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={form.trialPrice}
                    onChange={(e) => update('trialPrice', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">单次价格</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={form.singlePrice}
                    onChange={(e) => update('singlePrice', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">10次价格</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={form.tenPackPrice}
                    onChange={(e) => update('tenPackPrice', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">20次价格</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={form.twentyPackPrice}
                    onChange={(e) => update('twentyPackPrice', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </label>
            </div>
          </fieldset>

          {/* ── 其他信息 ── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
              其他信息
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">首节试听课日期</span>
                <input
                  type="date"
                  value={form.firstTrialDate}
                  onChange={(e) => update('firstTrialDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">文档链接</span>
                <input
                  type="url"
                  value={form.docLink}
                  onChange={(e) => update('docLink', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如飞书文档链接"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">器乐基础</span>
                <input
                  type="text"
                  value={form.instrumentBackground}
                  onChange={(e) => update('instrumentBackground', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如：自学过半年木吉他"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">音乐偏好</span>
                <input
                  type="text"
                  value={form.musicPreference}
                  onChange={(e) => update('musicPreference', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如：指弹、布鲁斯"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="其他需要记录的信息"
              />
            </label>
          </fieldset>

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
              {isEdit ? '保存修改' : '添加学生'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
