import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Star, Upload, Link, FileText } from 'lucide-react'
import type { Material, MaterialCategory } from '../types'
import { MATERIAL_CATEGORIES } from '../types'

type MaterialFormData = Omit<Material, 'id'>

const EMPTY_FORM: MaterialFormData = {
  content: '',
  parentId: null,
  category: '演奏技法',
  difficulty: 1,
  fileLink: '',
  fileName: '',
  targetSpeed: '',
  notes: '',
}

interface Props {
  material?: Material | null
  parentOptions: Material[]       // 可选的一级内容主题列表（parentId=null 的课件）
  onSave: (data: MaterialFormData) => void
  onClose: () => void
}

export default function MaterialModal({ material, parentOptions, onSave, onClose }: Props) {
  const isEdit = !!material
  const [form, setForm] = useState<MaterialFormData>(EMPTY_FORM)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 是否作为子练习（新增模式下控制；编辑模式根据实际 parentId）
  const [isChild, setIsChild] = useState(false)

  useEffect(() => {
    if (material) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = material
      setForm(data)
      setIsChild(data.parentId !== null && data.parentId !== undefined)
    } else {
      setForm(EMPTY_FORM)
      setIsChild(false)
    }
  }, [material])

  const update = <K extends keyof MaterialFormData>(key: K, value: MaterialFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // 切换一级/子练习
  const handleToggleChild = (child: boolean) => {
    setIsChild(child)
    if (!child) {
      update('parentId', null)
    } else {
      update('parentId', undefined as unknown as number | null)
    }
  }

  // 当前分类下的一级内容主题
  const filteredParentOptions = useMemo(() => {
    return parentOptions.filter((p) => p.category === form.category && p.id !== material?.id)
  }, [parentOptions, form.category, material?.id])

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        fileLink: reader.result as string,
        fileName: file.name,
      }))
    }
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
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑课件' : '新增课件'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 分类 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              分类 <span className="text-red-400">*</span>
            </span>
            <select
              value={form.category}
              onChange={(e) => {
                update('category', e.target.value as MaterialCategory)
                update('parentId', null)
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* 层级选择 */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">内容层级</span>
            <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => handleToggleChild(false)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  !isChild
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📁 一级内容主题
              </button>
              <button
                type="button"
                onClick={() => handleToggleChild(true)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  isChild
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📄 子练习
              </button>
            </div>

            {/* 选择父级 */}
            {isChild && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  所属内容主题 <span className="text-red-400">*</span>
                </span>
                <select
                  value={form.parentId ?? ''}
                  onChange={(e) => update('parentId', e.target.value ? Number(e.target.value) : null)}
                  required={isChild}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>请选择一级内容主题</option>
                  {filteredParentOptions.map((p) => (
                    <option key={p.id} value={p.id!}>{p.content}</option>
                  ))}
                </select>
                {filteredParentOptions.length === 0 && (
                  <p className="text-xs text-amber-600">
                    当前分类下暂无一级内容主题，请先创建一个
                  </p>
                )}
              </label>
            )}
          </div>

          {/* 教学内容 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              教学内容 <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              required
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={isChild ? '如：闷音练习、跨弦练习' : '如：强力和弦、交替拨弦'}
            />
          </label>

          {/* 难度 - 星评选 */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">难度</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => {
                const filled = i < form.difficulty
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => update('difficulty', i + 1)}
                    className="transition-colors hover:scale-110"
                    title={`${i + 1} 星`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                )
              })}
              <span className="ml-2 text-sm text-slate-500">
                {form.difficulty} / 10 星
              </span>
            </div>
          </div>

          {/* 课件 */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">课件</span>

            <div className="relative">
              <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={form.fileLink && !form.fileLink.startsWith('data:') ? form.fileLink : ''}
                onChange={(e) => update('fileLink', e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="粘贴飞书文档链接"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                上传本地文件
              </button>

              {form.fileName && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <FileText className="h-4 w-4" />
                  {form.fileName}
                </span>
              )}
            </div>
          </div>

          {/* 目标速度 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">目标速度</span>
            <input
              type="text"
              value={form.targetSpeed}
              onChange={(e) => update('targetSpeed', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="如：120 BPM"
            />
          </label>

          {/* 备注 */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">备注</span>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="其他需要记录的信息"
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
              {isEdit ? '保存修改' : '添加课件'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
