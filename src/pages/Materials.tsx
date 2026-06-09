import { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen,
  Star,
  ExternalLink,
  Download,
  Folder,
  FileText,
} from 'lucide-react'
import { getAllMaterials, addMaterial, updateMaterial, deleteMaterial } from '../api'
import type { Material, MaterialCategory } from '../types'
import { MATERIAL_CATEGORIES } from '../types'
import MaterialModal from '../components/MaterialModal'

// ── 分类配色 ──
const CATEGORY_STYLE: Record<MaterialCategory, { bg: string; text: string; dot: string; border: string }> = {
  '演奏技法':     { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200' },
  '乐理':         { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  border: 'border-purple-200' },
  '曲目与乐段':   { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200' },
  '机能与节奏感': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  '设备知识':     { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-500',   border: 'border-slate-300' },
  '软件使用':     { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500',    border: 'border-cyan-200' },
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[] | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null)

  const load = () => getAllMaterials().then(setMaterials)

  useEffect(() => {
    load()
  }, [])

  // 分离一级主题和子练习
  const { parents, childrenMap } = useMemo(() => {
    if (!materials) return { parents: [], childrenMap: new Map<number, Material[]>() }
    const p: Material[] = []
    const map = new Map<number, Material[]>()
    for (const m of materials) {
      if (m.parentId === null || m.parentId === undefined) {
        p.push(m)
      } else {
        const arr = map.get(m.parentId) || []
        arr.push(m)
        map.set(m.parentId, arr)
      }
    }
    return { parents: p, childrenMap: map }
  }, [materials])

  // 所有一级主题（用于 Modal 的 parentOptions）
  const parentOptions = parents

  // 搜索 → 按分类 → 一级主题（含子练习）
  const grouped = useMemo(() => {
    if (!materials) return []

    const q = search.trim().toLowerCase()

    // 过滤：匹配一级主题名、子练习名、备注等
    const filteredParents = parents.filter((p) => {
      if (!q) return true
      const children = childrenMap.get(p.id!) || []
      const matchParent =
        p.content.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
      const matchChild = children.some(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.targetSpeed.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q)
      )
      return matchParent || matchChild
    })

    // 按分类分组
    const catMap = new Map<MaterialCategory, Material[]>()
    for (const p of filteredParents) {
      const arr = catMap.get(p.category) || []
      arr.push(p)
      catMap.set(p.category, arr)
    }

    return MATERIAL_CATEGORIES
      .map((cat) => {
        const items = catMap.get(cat)
        if (!items || items.length === 0) return null
        // 一级主题按内容名排序
        items.sort((a, b) => a.content.localeCompare(b.content, 'zh'))
        const total = items.reduce((s, p) => s + 1 + (childrenMap.get(p.id!)?.length || 0), 0)
        return { category: cat, items, total, childrenMap }
      })
      .filter(Boolean) as {
        category: MaterialCategory
        items: Material[]
        total: number
        childrenMap: Map<number, Material[]>
      }[]
  }, [materials, search, parents, childrenMap])

  const handleAdd = async (data: Omit<Material, 'id'>) => {
    await addMaterial(data)
    setModalOpen(false)
    load()
  }

  const handleEdit = async (data: Omit<Material, 'id'>) => {
    if (!editingMaterial?.id) return
    await updateMaterial(editingMaterial.id, data)
    setEditingMaterial(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    // 如果删除的是一级主题，同时删除其所有子练习
    if (deleteTarget.parentId === null || deleteTarget.parentId === undefined) {
      const kids = childrenMap.get(deleteTarget.id!) || []
      for (const kid of kids) {
        if (kid.id) await deleteMaterial(kid.id)
      }
    }
    await deleteMaterial(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const isFileData = (link: string) => link.startsWith('data:')

  // 渲染单行（一级主题或子练习）
  const renderRow = (m: Material, isParent: boolean) => {
    const kids = isParent ? (childrenMap.get(m.id!) || []) : []
    return (
      <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${isParent ? 'bg-slate-50/30' : ''}`}>
        <td className="px-5 py-2.5">
          <div className="flex items-center gap-2">
            {isParent ? (
              <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-slate-300 flex-shrink-0 ml-4" />
            )}
            <span className={`${isParent ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
              {m.content}
            </span>
            {isParent && kids.length > 0 && (
              <span className="text-xs text-slate-400">({kids.length} 项)</span>
            )}
          </div>
        </td>
        <td className="px-5 py-2.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < m.difficulty
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
        </td>
        <td className="px-5 py-2.5">
          {m.fileLink ? (
            isFileData(m.fileLink) ? (
              <a
                href={m.fileLink}
                download={m.fileName || '课件文件'}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-xs truncate max-w-[100px]">{m.fileName || '下载'}</span>
              </a>
            ) : (
              <a
                href={m.fileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="text-xs">打开文档</span>
              </a>
            )
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </td>
        <td className="px-5 py-2.5 text-slate-600 text-xs">
          {m.targetSpeed || '-'}
        </td>
        <td className="px-5 py-2.5 text-slate-500 text-xs max-w-[180px] truncate">
          {m.notes || '-'}
        </td>
        <td className="px-5 py-2.5">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                setEditingMaterial(m)
                setModalOpen(true)
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
              title="编辑"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(m)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 顶部 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">课件汇总</h2>
          <p className="mt-1 text-sm text-slate-500">
            {materials ? `共 ${parents.length} 个内容主题，${materials.length - parents.length} 个子练习` : '加载中…'}
            {search.trim() && materials && (
              <span className="text-blue-600"> · 筛选出 {grouped.reduce((s, g) => s + g.total, 0)} 项</span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMaterial(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          新增课件
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索教学内容、目标速度…"
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 加载 */}
      {materials === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-400">加载中…</span>
        </div>
      )}

      {/* 空状态 */}
      {materials?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FolderOpen className="h-16 w-16 mb-4" />
          <p className="text-sm">还没有添加课件</p>
          <button
            onClick={() => {
              setEditingMaterial(null)
              setModalOpen(true)
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            添加第一份课件
          </button>
        </div>
      )}

      {/* 搜索无结果 */}
      {materials && materials.length > 0 && grouped.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">
          没有匹配的课件
        </div>
      )}

      {/* 按分类 → 一级主题 → 子练习 */}
      {grouped.map(({ category, items, total, childrenMap: cmap }) => {
        const style = CATEGORY_STYLE[category]
        return (
          <div key={category} className={`overflow-hidden rounded-xl border-2 ${style.border} bg-white shadow-sm`}>
            {/* 分类标题 */}
            <div className={`flex items-center gap-3 border-b ${style.border} px-5 py-3 ${style.bg}`}>
              <span className={`h-3 w-3 rounded-full ${style.dot}`} />
              <h3 className={`text-base font-semibold ${style.text}`}>{category}</h3>
              <span className={`ml-auto text-sm font-medium ${style.text} opacity-70`}>
                {total} 项
              </span>
            </div>

            {/* 一级主题 + 子练习 */}
            {items.map((parent) => {
              const kids = cmap.get(parent.id!) || []
              return (
                <div key={parent.id} className="border-b border-slate-50 last:border-b-0">
                  {/* 一级主题行 */}
                  <div className="bg-slate-50/40">
                    <table className="w-full text-sm">
                      <tbody>
                        {renderRow(parent, true)}
                      </tbody>
                    </table>
                  </div>

                  {/* 子练习行 */}
                  {kids.length > 0 && (
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-50">
                        {kids
                          .sort((a, b) => b.difficulty - a.difficulty)
                          .map((kid) => renderRow(kid, false))}
                      </tbody>
                    </table>
                  )}

                  {/* 空子练习提示 */}
                  {kids.length === 0 && (
                    <div className="px-11 py-2 text-xs text-slate-400">
                      暂无子练习 —
                      <button
                        onClick={() => {
                          setEditingMaterial(null)
                          setModalOpen(true)
                        }}
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        添加
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* 新增/编辑弹窗 */}
      {modalOpen && (
        <MaterialModal
          material={editingMaterial}
          parentOptions={parentOptions}
          onSave={(data) => {
            if (editingMaterial) {
              handleEdit(data)
            } else {
              handleAdd(data)
            }
          }}
          onClose={() => {
            setModalOpen(false)
            setEditingMaterial(null)
          }}
        />
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">确认删除</h4>
            <p className="mt-2 text-sm text-slate-500">
              确定要删除
              <span className="font-medium text-slate-900"> {deleteTarget.content} </span>
              吗？此操作不可撤销。
              {deleteTarget.parentId === null && (childrenMap.get(deleteTarget.id!) || []).length > 0 && (
                <span className="block mt-1 text-amber-600 font-medium">
                  该主题下的 {(childrenMap.get(deleteTarget.id!) || []).length} 个子练习也将被删除！
                </span>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
