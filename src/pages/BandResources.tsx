import { useEffect, useState } from 'react'
import { Plus, Search, Loader2, FolderArchive, Edit3, Trash2, FileText, Link as LinkIcon } from 'lucide-react'
import { getAllCloudFiles, addCloudFile, updateCloudFile, deleteCloudFile } from '../api'
import type { CloudFile, CloudFileCategory } from '../types'
import { CLOUD_FILE_CATEGORIES } from '../types'
import BandResourceModal from '../components/BandResourceModal'

const CAT_COLORS: Record<CloudFileCategory, string> = {
  '乐谱': 'bg-amber-100 text-amber-700',
  '音频': 'bg-violet-100 text-violet-700',
  '文档': 'bg-blue-100 text-blue-700',
  '伴奏': 'bg-emerald-100 text-emerald-700',
  '其他': 'bg-slate-100 text-slate-600',
}

export default function BandResources() {
  const [resources, setResources] = useState<CloudFile[] | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CloudFileCategory | '全部'>('全部')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CloudFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CloudFile | null>(null)

  const load = () => getAllCloudFiles().then(setResources)
  useEffect(() => { load() }, [])

  const handleAdd = async (data: Omit<CloudFile, 'id'>) => {
    await addCloudFile(data)
    setModalOpen(false)
    load()
  }

  const handleEdit = async (data: Omit<CloudFile, 'id'>) => {
    if (!editing?.id) return
    await updateCloudFile(editing.id, data)
    setEditing(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await deleteCloudFile(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = resources?.filter((r) => {
    if (categoryFilter !== '全部' && r.category !== categoryFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [r.title, r.category, r.fileName, r.notes].filter(Boolean).join(' ').toLowerCase().includes(q)
  }) ?? []

  const openFile = (r: CloudFile) => {
    if (r.fileData) {
      // base64 data URL → 新窗口打开
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(`<iframe src="${r.fileData}" style="width:100%;height:100%;border:none"></iframe>`)
      }
    } else if (r.fileLink) {
      window.open(r.fileLink, '_blank')
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">各类资料与网盘</h2>
          {resources && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
              {resources.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> 新增资源
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索资源名称、文件名…"
          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {(['全部', ...CLOUD_FILE_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {resources === null && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty */}
      {resources?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FolderArchive className="h-12 w-12 mb-3" />
          <p className="text-sm">暂无资料</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
            添加第一个资源
          </button>
        </div>
      )}

      {/* No search results */}
      {resources && resources.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search className="h-10 w-10 mb-3" />
          <p className="text-sm">未找到匹配的资源</p>
        </div>
      )}

      {/* Resource grid */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const hasFile = !!r.fileData
            const hasLink = !!r.fileLink
            const isClickable = hasFile || hasLink

            return (
              <div
                key={r.id}
                onClick={() => isClickable ? openFile(r) : undefined}
                className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${
                  isClickable ? 'cursor-pointer hover:border-blue-300' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[r.category as CloudFileCategory] || CAT_COLORS['其他']}`}>
                        {r.category}
                      </span>
                      {hasFile && <FileText className="h-3.5 w-3.5 text-slate-400" />}
                      {hasLink && !hasFile && <LinkIcon className="h-3.5 w-3.5 text-slate-400" />}
                    </div>
                    <h4 className="font-semibold text-slate-900 truncate mt-1.5">{r.title}</h4>
                    {r.fileName && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{r.fileName}</p>
                    )}
                    {r.notes && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(r); setModalOpen(true) }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(r) }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <BandResourceModal
          resource={editing}
          onSave={(data) => { editing ? handleEdit(data) : handleAdd(data) }}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">确认删除</h4>
            <p className="mt-2 text-sm text-slate-600">
              确定要删除资源「{deleteTarget.title}」吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                取消
              </button>
              <button onClick={handleDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition-colors">
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
