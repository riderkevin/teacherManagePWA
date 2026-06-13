import { useEffect, useState } from 'react'
import { Plus, Search, Loader2, Edit3, Trash2, Music, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { getAllBandEvents, addBandEvent, updateBandEvent, deleteBandEvent, getBandEventSongs, setBandEventSongs, getAllBandSongs } from '../api'
import type { BandEvent, BandSong, BandEventSong } from '../types'
import BandEventModal from '../components/BandEventModal'

export default function BandPerformances() {
  const [events, setEvents] = useState<BandEvent[] | null>(null)
  const [songs, setSongs] = useState<BandSong[]>([])
  const [eventSongs, setEventSongs] = useState<Record<number, BandEventSong[]>>({})
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BandEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BandEvent | null>(null)
  const [setlistOpen, setSetlistOpen] = useState<number | null>(null)
  const [selectedSongs, setSelectedSongs] = useState<number[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const load = () => {
    getAllBandEvents().then(setEvents)
    getAllBandSongs().then(setSongs)
  }
  useEffect(() => { load() }, [])

  const loadSetlist = async (eventId: number) => {
    const es = await getBandEventSongs(eventId)
    setEventSongs((prev) => ({ ...prev, [eventId]: es }))
    setSelectedSongs(es.map((e) => e.songId))
    setSetlistOpen(eventId)
  }

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const handleSaveSetlist = async () => {
    if (setlistOpen === null) return
    await setBandEventSongs(setlistOpen, selectedSongs)
    const es = await getBandEventSongs(setlistOpen)
    setEventSongs((prev) => ({ ...prev, [setlistOpen]: es }))
    setSetlistOpen(null)
  }

  // 只显示演出，按日期倒序
  const performances = (events ?? [])
    .filter((e) => e.type === '演出')
    .sort((a, b) => b.date.localeCompare(a.date))

  const filtered = performances.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [e.title, e.location, e.address, e.notes].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  // 格式化日期：2026/8/14
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-')
    const [y, m, d] = parts
    return `${parseInt(y)}/${parseInt(m)}/${parseInt(d)}`
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">演出日程</h2>
          {events && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
              {performances.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> 新增演出
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索演出..."
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
      {performances.length === 0 && events !== null && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-sm">暂无演出日程</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
            添加第一个演出
          </button>
        </div>
      )}

      {/* Performance list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((event) => {
            const setlist = eventSongs[event.id!]
            const isExpanded = expanded.has(event.id!)

            return (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                {/* 一级信息 */}
                <div className="flex items-start justify-between p-4">
                  <div className="flex-1 min-w-0">
                    {/* 日期-演出名称 */}
                    <h4 className="font-semibold text-slate-900">
                      {formatDate(event.date)} {event.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                      {/* 时间 */}
                      {event.startTime && (
                        <span>{event.startTime}{event.endTime ? `-${event.endTime}` : ''}</span>
                      )}
                      {/* 演出地点 */}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {event.location}
                        </span>
                      )}
                      {/* 演出地址 */}
                      {event.address && (
                        <span className="text-slate-400 truncate max-w-[200px]">{event.address}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => loadSetlist(event.id!)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                      title="编辑曲目单"
                    >
                      <Music className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditing(event); setModalOpen(true) }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleExpand(event.id!)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 二级信息（可折叠） */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-2">
                    {/* 演出曲目 */}
                    <div className="text-sm">
                      <span className="text-slate-400">演出曲目：</span>
                      {setlist && setlist.length > 0 ? (
                        <span className="text-slate-700">
                          {setlist.map((es, idx) => (
                            <span key={es.id}>
                              {idx > 0 && '、'}{es.songTitle}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-slate-400">未设置</span>
                      )}
                    </div>
                    {/* 演出语言 */}
                    <div className="text-sm">
                      <span className="text-slate-400">演出语言：</span>
                      <span className="text-slate-700">{event.language || '日文'}</span>
                    </div>
                    {/* 备注 */}
                    <div className="text-sm">
                      <span className="text-slate-400">备注：</span>
                      <span className="text-slate-700">{event.notes || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Setlist Modal */}
      {setlistOpen !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSetlistOpen(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
            <h4 className="text-lg font-semibold text-slate-900">编辑曲目单</h4>
            <p className="text-sm text-slate-500 mt-1">勾选并排序演出曲目</p>
            <div className="mt-4 space-y-1 max-h-60 overflow-y-auto">
              {songs.map((song) => {
                const checked = selectedSongs.includes(song.id!)
                return (
                  <label
                    key={song.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedSongs((prev) =>
                          checked ? prev.filter((id) => id !== song.id) : [...prev, song.id!]
                        )
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{song.title}</span>
                    {song.artist && <span className="text-xs text-slate-400">- {song.artist}</span>}
                  </label>
                )
              })}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setSetlistOpen(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                取消
              </button>
              <button onClick={handleSaveSetlist} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                保存曲目单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {modalOpen && (
        <BandEventModal
          event={editing}
          defaultType="演出"
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
              确定要删除演出「{deleteTarget.title}」吗？关联的曲目单也会被删除，此操作不可撤销。
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
