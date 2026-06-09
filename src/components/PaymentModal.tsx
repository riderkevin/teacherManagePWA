import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Payment } from '../types'

type PaymentFormData = Omit<Payment, 'id'>

const EMPTY_FORM: PaymentFormData = {
  studentId: 0,
  studentName: '',
  date: '',
  amount: 0,
  packageLabel: '',
  lessonCount: 10,
  notes: '',
}

interface Props {
  studentId: number
  studentName: string
  payment?: Payment | null
  onSave: (data: PaymentFormData) => void
  onClose: () => void
}

export default function PaymentModal({ studentId, studentName, payment, onSave, onClose }: Props) {
  const isEdit = !!payment
  const [form, setForm] = useState<PaymentFormData>(EMPTY_FORM)

  useEffect(() => {
    if (payment) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = payment
      setForm(data)
    } else {
      const now = new Date()
      const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      setForm({ ...EMPTY_FORM, studentId, studentName, date: today })
    }
  }, [payment, studentId, studentName])

  const update = <K extends keyof PaymentFormData>(key: K, value: PaymentFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const dateForInput = form.date ? form.date.replace(/\//g, '-') : ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑缴费记录' : '新增缴费记录'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* 学生名称（只读） */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">学生</span>
            <input
              type="text"
              value={studentName}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
          </label>

          {/* 缴费日期 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              缴费日期 <span className="text-red-400">*</span>
            </span>
            <input
              type="date"
              required
              value={dateForInput}
              onChange={(e) => update('date', e.target.value.replace(/-/g, '/'))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {/* 套餐标签 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              套餐标签 <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              required
              value={form.packageLabel}
              onChange={(e) => update('packageLabel', e.target.value)}
              placeholder="如：正式课一期"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {/* 金额 + 节数 同行 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                缴费金额 <span className="text-red-400">*</span>
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={form.amount || ''}
                  onChange={(e) => update('amount', Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                节数 <span className="text-red-400">*</span>
              </span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={form.lessonCount || ''}
                onChange={(e) => update('lessonCount', Number(e.target.value))}
                placeholder="10"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* 备注 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">备注</span>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="选填"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
              {isEdit ? '保存修改' : '添加缴费记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
