import { useEffect, useState } from 'react'
import { Plus, Search, Loader2, Music, Edit3, Trash2 } from 'lucide-react'
import { getAllBandSongs, addBandSong, updateBandSong, deleteBandSong } from '../api'
import type { BandSong } from '../types'
import BandSongModal from '../components/BandSongModal'

export default function BandSongs() {
  const [songs, setSongs] = useState<BandSong[] | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BandSong | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BandSong | null>(null)

  const load = () => getAllBandSongs().then(setSongs)
  useEffect(() => { load() }, [])

  const handleAdd = async (data: Omit<BandSong, 'id'>) => {
    await addBandSong(data)
    setModalOpen(false)
    load()
  }

  const handleEdit = async (data: Omit<BandSong, 'id'>) => {
    if (!editing?.id) return
    await updateBandSong(editing.id, data)
    setEditing(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await deleteBandSong(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = songs?.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [s.title, s.artist, s.notes].filter(Boolean).join(' ').toLowerCase().includes(q)
  }) ?? []

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">曲目库</h2>
          {songs && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
              {songs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> 新增曲目
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索曲目或作者..."
          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {songs === null && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty */}
      {songs?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Music className="h-12 w-12 mb-3" />
          <p className="text-sm">暂无曲目</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
            添加第一首曲目
          </button>
        </div>
      )}

      {/* No search results */}
      {songs && songs.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search className="h-10 w-10 mb-3" />
          <p className="text-sm">未找到匹配的曲目</p>
        </div>
      )}

      {/* Song list */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((song) => (
            <div
              key={song.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{song.title}</h4>
                  {song.artist && (
                    <p className="text-sm text-slate-500 mt-0.5">{song.artist}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={() => { setEditing(song); setModalOpen(true) }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(song)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                {song.songKey && <span className="bg-slate-100 rounded px-2 py-0.5">{song.songKey}</span>}
                {song.duration && <span>{song.duration}</span>}
              </div>
              {song.notes && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{song.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <BandSongModal
          song={editing}
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
              确定要删除曲目「{deleteTarget.title}」吗？此操作不可撤销。
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
