import { useState, useEffect } from 'react'
import { X, Plus, Trash2, FileText, Upload, Link, Loader2 } from 'lucide-react'
import { getLessonMaterials, addLessonMaterial, deleteLessonMaterial, getAllMaterials } from '../api'
import type { LessonMaterial, Material } from '../types'

interface Props {
  lessonId: number
  lessonTitle: string
  onClose: () => void
}

type AddMode = 'library' | 'upload' | 'text'

export default function LessonMaterialModal({ lessonId, lessonTitle, onClose }: Props) {
  const [items, setItems] = useState<LessonMaterial[] | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [mode, setMode] = useState<AddMode>('library')

  // 新增表单
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(0)
  const [textContent, setTextContent] = useState('')
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadFileData, setUploadFileData] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [list, mats] = await Promise.all([
      getLessonMaterials(lessonId),
      getAllMaterials(),
    ])
    setItems(list)
    setMaterials(mats)
  }

  useEffect(() => { load() }, [lessonId])

  // ── 添加附件 ──
  const handleAdd = async () => {
    setSaving(true)
    try {
      if (mode === 'library' && selectedMaterialId) {
        const mat = materials.find((m) => m.id === selectedMaterialId)
        if (!mat) return
        // 课件库的文件：如果是base64本地文件 → 放入fileData；如果是http链接 → 放入fileLink
        const isDataUrl = mat.fileLink?.startsWith('data:')
        await addLessonMaterial({
          lessonId,
          materialId: selectedMaterialId,
          text: mat.content || '',
          fileName: mat.fileName || '',
          fileData: isDataUrl ? mat.fileLink : '',
          fileLink: isDataUrl ? '' : (mat.fileLink || ''),
        })
      } else if (mode === 'text' && textContent.trim()) {
        await addLessonMaterial({
          lessonId,
          materialId: undefined as unknown as number,
          text: textContent.trim(),
          fileName: '',
          fileData: '',
          fileLink: '',
        })
      } else if (mode === 'upload' && (uploadFileData || uploadFileName)) {
        await addLessonMaterial({
          lessonId,
          materialId: undefined as unknown as number,
          text: uploadFileName,
          fileName: uploadFileName,
          fileData: uploadFileData,
          fileLink: '',
        })
      } else {
        setSaving(false)
        return
      }

      // 重置表单
      setSelectedMaterialId(0)
      setTextContent('')
      setUploadFileName('')
      setUploadFileData('')
      load()
    } finally {
      setSaving(false)
    }
  }

  // ── 删除附件 ──
  const handleDelete = async (id: number) => {
    await deleteLessonMaterial(id)
    load()
  }

  // ── 文件上传处理 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setUploadFileData(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white shadow-2xl">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">课程课件</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{lessonTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── 已有附件列表 ── */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              已添加课件 {items !== null && `(${items.length})`}
            </h4>
            {items === null ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">暂无课件，请添加</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      {item.materialId ? (
                        <span className="text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded mr-1.5">课件库</span>
                      ) : item.fileData ? (
                        <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded mr-1.5">文件</span>
                      ) : (
                        <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded mr-1.5">备注</span>
                      )}
                      <span className="text-sm text-slate-700">
                        {item.materialId
                          ? item.text
                          : item.fileData
                            ? item.fileName
                            : item.text}
                      </span>
                      {item.fileLink && /^https?:\/\//.test(item.fileLink) && (
                        <a href={item.fileLink} target="_blank" rel="noopener noreferrer"
                          className="block text-xs text-blue-500 hover:underline mt-0.5 ml-10">
                          打开链接 →
                        </a>
                      )}
                      {item.fileLink && item.fileLink.startsWith('data:') && !item.fileData && (
                        <span className="block text-xs text-slate-400 mt-0.5 ml-10">本地文件</span>
                      )}
                      {item.fileData && (
                        <a href={item.fileData} download={item.fileName} target="_blank" rel="noopener noreferrer"
                          className="block text-xs text-blue-500 hover:underline mt-0.5 ml-10">
                          下载文件 →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      className="ml-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 分隔线 ── */}
          <div className="border-t border-slate-100" />

          {/* ── 添加新课件 ── */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">添加课件</h4>

            {/* 模式切换 */}
            <div className="flex gap-1 mb-3">
              {([
                ['library', '课件库', Link],
                ['upload', '本地上传', Upload],
                ['text', '文字备注', FileText],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    mode === key
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* 课件库选择 */}
            {mode === 'library' && (
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={0}>选择课件…</option>
                {materials
                  .filter((m) => m.parentId === null)
                  .map((p) => (
                    <optgroup key={p.id} label={`${p.category} · ${p.content}`}>
                      <option value={p.id!}>{p.content}（一级主题）</option>
                      {materials
                        .filter((c) => c.parentId === p.id)
                        .map((c) => (
                          <option key={c.id} value={c.id!}>
                            └ {c.content}
                            {c.fileLink ? ' 🔗' : ''}
                          </option>
                        ))}
                    </optgroup>
                  ))}
              </select>
            )}

            {/* 本地上传 */}
            {mode === 'upload' && (
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadFileName && (
                  <p className="text-xs text-slate-500">已选择: {uploadFileName}</p>
                )}
              </div>
            )}

            {/* 文字备注 */}
            {mode === 'text' && (
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="输入课件备注或文字内容…"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            )}

            {/* 添加按钮 */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              添加课件
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
