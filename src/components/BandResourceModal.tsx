import { useState, useEffect, useRef } from 'react'
import { X, Upload, Link, FileText, Loader2 } from 'lucide-react'
import type { CloudFile, CloudFileCategory } from '../types'
import { CLOUD_FILE_CATEGORIES } from '../types'

type FormData = Omit<CloudFile, 'id'>
type AddMode = 'upload' | 'link' | 'text'

const EMPTY: FormData = {
  title: '',
  category: '其他',
  fileName: '',
  fileData: '',
  fileLink: '',
  notes: '',
  createdAt: new Date().toISOString(),
}

interface Props {
  resource?: CloudFile | null
  onSave: (data: FormData) => void
  onClose: () => void
}

export default function BandResourceModal({ resource, onSave, onClose }: Props) {
  const isEdit = !!resource
  const [form, setForm] = useState<FormData>(EMPTY)
  const [mode, setMode] = useState<AddMode>('upload')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (resource) {
      const { id, ...data } = resource
      setForm(data)
      // 推断当前模式
      if (data.fileData) setMode('upload')
      else if (data.fileLink) setMode('link')
      else setMode('text')
    } else {
      setForm({ ...EMPTY, createdAt: new Date().toISOString() })
      setMode('upload')
    }
  }, [resource])

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      update('fileData', reader.result as string)
      update('fileName', file.name)
      if (!form.title) update('title', file.name.replace(/\.[^.]+$/, ''))
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
            {isEdit ? '编辑资源' : '新增资源'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 标题 */}
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              资源名称 <span className="text-red-400">*</span>
            </span>
            <input
              type="text" required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="如：Hotel California 吉他谱"
            />
          </label>

          {/* 分类 */}
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">分类</span>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value as CloudFileCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CLOUD_FILE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          {/* 添加模式切换 */}
          {!isEdit && (
            <div className="flex gap-2">
              {([
                { key: 'upload' as AddMode, label: '本地上传', icon: Upload },
                { key: 'link' as AddMode, label: '外部链接', icon: Link },
                { key: 'text' as AddMode, label: '文字备注', icon: FileText },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key)
                    // 切换模式时清除其他模式的数据
                    if (key === 'upload') { update('fileLink', ''); update('notes', '') }
                    else if (key === 'link') { update('fileData', ''); update('fileName', ''); update('notes', '') }
                    else { update('fileData', ''); update('fileName', ''); update('fileLink', '') }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    mode === key
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 本地上传 */}
          {(mode === 'upload' || (isEdit && form.fileData)) && (
            <div className="space-y-2">
              {form.fileName ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{form.fileName}</span>
                  <button
                    type="button"
                    onClick={() => { update('fileData', ''); update('fileName', '') }}
                    className="ml-auto text-emerald-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    {uploading ? '读取文件中…' : '点击选择文件'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* 外部链接 */}
          {(mode === 'link' || (isEdit && form.fileLink && !form.fileData)) && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">链接地址</span>
              <input
                type="url"
                value={form.fileLink}
                onChange={(e) => update('fileLink', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://..."
              />
            </label>
          )}

          {/* 文字备注 */}
          {(mode === 'text' || isEdit) && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">备注</span>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="输入备注信息…"
              />
            </label>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              取消
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              {isEdit ? '保存修改' : '添加资源'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
