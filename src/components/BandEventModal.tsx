import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { BandEvent, BandEventType } from '../types'

type FormData = Omit<BandEvent, 'id'>

const EMPTY: FormData = {
  type: '排练',
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  notes: '',
  createdAt: new Date().toISOString(),
}

interface Props {
  event?: BandEvent | null
  defaultType?: BandEventType
  onSave: (data: FormData) => void
  onClose: () => void
}

export default function BandEventModal({ event, defaultType, onSave, onClose }: Props) {
  const isEdit = !!event
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => {
    if (event) {
      const { id, ...data } = event
      setForm(data)
    } else {
      setForm({ ...EMPTY, type: defaultType || '排练', createdAt: new Date().toISOString() })
    }
  }, [event, defaultType])

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑日程' : '新增日程'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 类型 */}
          <div className="flex gap-3">
            {(['演出', '排练'] as BandEventType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update('type', t)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === '演出'
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t === '演出' ? '🎸 演出' : '🥁 排练'}
              </button>
            ))}
          </div>

          {/* 基本信息 */}
          <div className="grid gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">
                {form.type === '演出' ? '演出名称' : '排练主题'} <span className="text-red-400">*</span>
              </span>
              <input
                type="text" required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={form.type === '演出' ? '如：夏日音乐节' : '如：新歌联排'}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">
                日期 <span className="text-red-400">*</span>
              </span>
              <input
                type="date" required
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">开始时间</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">结束时间</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">地点</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：排练房 / XX Livehouse"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder={form.type === '演出' ? '如：票价、观众数等' : '如：重点排练曲目'}
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              取消
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              {isEdit ? '保存修改' : '添加日程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
