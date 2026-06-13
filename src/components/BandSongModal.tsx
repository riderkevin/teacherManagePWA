import { useState, useEffect, useRef } from 'react'
import { X, Upload, FileText, Loader2 } from 'lucide-react'
import type { BandSong } from '../types'
import { SONG_VERSIONS, SONG_ARRANGEMENTS } from '../types'

type FormData = Omit<BandSong, 'id'>

const EMPTY: FormData = {
  title: '',
  artist: '',
  ip: '',
  version: '原唱',
  arrangement: '乐队',
  bpm: '',
  songKey: '',
  sheetFileName: '',
  sheetData: '',
  duration: '',
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
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      update('sheetData', reader.result as string)
      update('sheetFileName', file.name)
      setUploading(false)
    }
    reader.onerror = () => setUploading(false)
    reader.readAsDataURL(file)
  }

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
            {/* 歌名 */}
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                歌名 <span className="text-red-400">*</span>
              </span>
              <input
                type="text" required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：Hotel California"
              />
            </label>

            {/* 歌手 */}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">歌手</span>
              <input
                type="text"
                value={form.artist}
                onChange={(e) => update('artist', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：Eagles"
              />
            </label>

            {/* 所属IP */}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">所属IP</span>
              <input
                type="text"
                value={form.ip}
                onChange={(e) => update('ip', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：灌篮高手"
              />
            </label>

            {/* 歌曲版本 */}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">歌曲版本</span>
              <div className="flex gap-2">
                {SONG_VERSIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => update('version', v)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      form.version === v
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </label>

            {/* 排练版本 */}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">排练版本</span>
              <div className="flex gap-2">
                {SONG_ARRANGEMENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => update('arrangement', a)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      form.arrangement === a
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </label>

            {/* BPM */}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">BPM</span>
              <input
                type="text"
                value={form.bpm}
                onChange={(e) => update('bpm', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：120"
              />
            </label>

            {/* 调 */}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">调</span>
              <input
                type="text"
                value={form.songKey}
                onChange={(e) => update('songKey', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="如：B小调"
              />
            </label>

            {/* 曲谱附件 */}
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">曲谱附件</span>
              {form.sheetFileName ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{form.sheetFileName}</span>
                  <button
                    type="button"
                    onClick={() => { update('sheetData', ''); update('sheetFileName', '') }}
                    className="ml-auto text-emerald-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input ref={fileRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    {uploading ? '读取文件中…' : '点击上传曲谱（PDF/图片）'}
                  </button>
                </>
              )}
            </label>

            {/* 时长 */}
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

            {/* 备注 */}
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
