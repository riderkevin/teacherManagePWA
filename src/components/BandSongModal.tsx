import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { BandSong } from '../types'

type FormData = Omit<BandSong, 'id'>

const EMPTY: FormData = {
  title: '',
  artist: '',
  duration: '',
  songKey: '',
  notes: '',
}

interface Props {
  song?: BandSong | null
  onSave: (data: FormData) => void
  onClose: () => void
}

export default function BandSongModal({ song, onSave, onClose }: Props) {
  const isEdit = !!song
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => {
    if (song) {
      const { id, ...data } = song
      setForm(data)
    } else {
      setForm(EMPTY)
    }
  }, [song])

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
            {isEdit ? '编辑曲目' : '新增曲目'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                曲目名称 <span className="text-red-400">*</span>
              </span>
              <input
                type="text" required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：Hotel California"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">原唱/原作者</span>
              <input
                type="text"
                value={form.artist}
                onChange={(e) => update('artist', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：Eagles"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">时长</span>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => update('duration', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：4:30"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">调式</span>
              <input
                type="text"
                value={form.songKey}
                onChange={(e) => update('songKey', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：B小调"
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="如：吉他solo难度较高"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              取消
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              {isEdit ? '保存修改' : '添加曲目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
