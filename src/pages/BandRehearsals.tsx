import { useEffect, useState } from 'react'
import { Plus, Search, Loader2, Edit3, Trash2 } from 'lucide-react'
import { getAllBandEvents, addBandEvent, updateBandEvent, deleteBandEvent } from '../api'
import type { BandEvent } from '../types'
import BandEventModal from '../components/BandEventModal'

export default function BandRehearsals() {
  const [events, setEvents] = useState<BandEvent[] | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BandEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BandEvent | null>(null)

  const load = () => getAllBandEvents().then(setEvents)
  useEffect(() => { load() }, [])

  const handleAdd = async (data: Omit<BandEvent, 'id'>) => {
    await addBandEvent(data)
    setModalOpen(false)
    load()
  }

  const handleEdit = async (data: Omit<BandEvent, 'id'>) => {
    if (!editing?.id) return
    await updateBandEvent(editing.id, data)
    setEditing(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await deleteBandEvent(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  // 只显示排练
  const rehearsals = events?.filter((e) => e.type === '排练') ?? []

  const filtered = rehearsals.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [e.date, e.location, e.notes].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  // 格式化日期：2026/5/21
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('/')
    return `${parseInt(y)}/${parseInt(m)}/${parseInt(d)}`
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">排练日程</h2>
          {events && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
              {rehearsals.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> 新增排练
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索排练..."
          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {events === null && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty */}
      {rehearsals.length === 0 && events !== null && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-sm">暂无排练日程</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
            添加第一个排练
          </button>
        </div>
      )}

      {/* Plain list */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3 w-28">日期</th>
                <th className="px-5 py-3 w-32">时间</th>
                <th className="px-5 py-3 w-20">时长</th>
                <th className="px-5 py-3">地点</th>
                <th className="px-5 py-3">备注</th>
                <th className="px-5 py-3 w-20 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-slate-900 font-medium">{formatDate(event.date)}</td>
                  <td className="px-5 py-3 text-slate-600">{event.startTime || '-'}-{event.endTime || '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{event.duration || 0}h</td>
                  <td className="px-5 py-3 text-slate-600">{event.location || '-'}</td>
                  <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate">{event.notes || '-'}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(event); setModalOpen(true) }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(event)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Event Modal */}
      {modalOpen && (
        <BandEventModal
          event={editing}
          defaultType="排练"
          simplified
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
              确定要删除 {formatDate(deleteTarget.date)} 的排练吗？此操作不可撤销。
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
