import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, Loader2, Music, Edit3, Trash2, FileText, Filter } from 'lucide-react'
import { getAllBandSongs, addBandSong, updateBandSong, deleteBandSong } from '../api'
import type { BandSong } from '../types'
import { SONG_VERSIONS, SONG_ARRANGEMENTS } from '../types'
import BandSongModal from '../components/BandSongModal'

export default function BandSongs() {
  const [songs, setSongs] = useState<BandSong[] | null>(null)
  const [search, setSearch] = useState('')
  const [filterVersion, setFilterVersion] = useState<string>('全部')
  const [filterArrangement, setFilterArrangement] = useState<string>('全部')
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

  // 按歌手排序 + 搜索 + 筛选
  const filtered = useMemo(() => {
    if (!songs) return []
    let result = [...songs]

    // 搜索
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        [s.title, s.artist, s.ip, s.bpm, s.songKey, s.notes].filter(Boolean).join(' ').toLowerCase().includes(q)
      )
    }

    // 版本筛选
    if (filterVersion !== '全部') {
      result = result.filter((s) => s.version === filterVersion)
    }

    // 编排筛选
    if (filterArrangement !== '全部') {
      result = result.filter((s) => s.arrangement === filterArrangement)
    }

    // 按歌手名称排序
    result.sort((a, b) => {
      const artistA = (a.artist || '').toLowerCase()
      const artistB = (b.artist || '').toLowerCase()
      if (artistA < artistB) return -1
      if (artistA > artistB) return 1
      // 同一歌手按歌名排
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    })

    return result
  }, [songs, search, filterVersion, filterArrangement])

  // 打开曲谱附件
  const openSheet = (song: BandSong) => {
    if (song.sheetData) {
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(`<iframe src="${song.sheetData}" style="width:100%;height:100%;border:none"></iframe>`)
      }
    }
  }

  // 版本标签颜色
  const versionBadge = (v: string) => {
    if (v === '原唱') return 'bg-amber-50 text-amber-600'
    if (v === '翻唱版') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-500'
  }

  // 编排标签颜色
  const arrBadge = (a: string) => {
    if (a === '乐队') return 'bg-emerald-50 text-emerald-600'
    if (a === '不插电') return 'bg-emerald-100 text-emerald-700'
    return 'bg-slate-100 text-slate-500'
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">排练歌单</h2>
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

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索歌名、歌手、IP…"
            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={filterVersion}
          onChange={(e) => setFilterVersion(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="全部">全部版本</option>
          {SONG_VERSIONS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select
          value={filterArrangement}
          onChange={(e) => setFilterArrangement(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="全部">全部编排</option>
          {SONG_ARRANGEMENTS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {(filterVersion !== '全部' || filterArrangement !== '全部' || search) && (
          <span className="text-xs text-slate-400">匹配 {filtered.length} 首</span>
        )}
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

      {/* 传统列表 */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {/* 表头 */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">歌名</div>
            <div className="col-span-2">歌手</div>
            <div className="col-span-2">标签</div>
            <div className="col-span-2">BPM / 调 / 时长</div>
            <div className="col-span-2">曲谱 / 操作</div>
          </div>

          {/* 列表行 */}
          <div className="divide-y divide-slate-100">
            {filtered.map((song, idx) => (
              <div
                key={song.id}
                className="md:grid md:grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors"
              >
                {/* 序号 */}
                <div className="hidden md:flex md:col-span-1 justify-center">
                  <span className="text-xs text-slate-400">{idx + 1}</span>
                </div>

                {/* 歌名 */}
                <div className="md:col-span-3 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-sm">{song.title}</p>
                </div>

                {/* 歌手 */}
                <div className="md:col-span-2 min-w-0">
                  <p className="text-sm text-slate-600 truncate">{song.artist || '-'}</p>
                </div>

                {/* 标签 */}
                <div className="md:col-span-2 flex items-center gap-1.5 flex-wrap">
                  {song.ip && (
                    <span className="text-xs bg-violet-50 text-violet-600 rounded px-2 py-0.5 font-medium">{song.ip}</span>
                  )}
                  {song.version && (
                    <span className={`text-xs rounded px-2 py-0.5 font-medium ${versionBadge(song.version)}`}>{song.version}</span>
                  )}
                  {song.arrangement && (
                    <span className={`text-xs rounded px-2 py-0.5 font-medium ${arrBadge(song.arrangement)}`}>{song.arrangement}</span>
                  )}
                </div>

                {/* BPM / 调 / 时长 */}
                <div className="md:col-span-2 flex items-center gap-3 text-xs text-slate-500">
                  {song.bpm && <span>BPM {song.bpm}</span>}
                  {song.songKey && <span className="bg-slate-100 rounded px-1.5 py-0.5">{song.songKey}</span>}
                  {song.duration && <span>{song.duration}</span>}
                </div>

                {/* 曲谱 + 操作按钮 */}
                <div className="md:col-span-2 flex items-center gap-1 justify-end">
                  {song.sheetFileName && song.sheetData && (
                    <button
                      onClick={() => openSheet(song)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 rounded px-2 py-1 hover:bg-blue-100 transition-colors"
                      title="查看曲谱"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[80px]">{song.sheetFileName}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setEditing(song); setModalOpen(true) }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="编辑"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(song)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 移动端：紧凑布局 */}
                <div className="md:hidden mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {song.ip && (
                      <span className="text-xs bg-violet-50 text-violet-600 rounded px-2 py-0.5">{song.ip}</span>
                    )}
                    {song.version && (
                      <span className={`text-xs rounded px-2 py-0.5 ${versionBadge(song.version)}`}>{song.version}</span>
                    )}
                    {song.arrangement && (
                      <span className={`text-xs rounded px-2 py-0.5 ${arrBadge(song.arrangement)}`}>{song.arrangement}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {song.bpm && <span>BPM {song.bpm}</span>}
                    {song.songKey && <span className="bg-slate-100 rounded px-1.5 py-0.5">{song.songKey}</span>}
                    {song.duration && <span>{song.duration}</span>}
                  </div>
                  {song.sheetFileName && song.sheetData && (
                    <button
                      onClick={() => openSheet(song)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="h-3 w-3" />
                      {song.sheetFileName}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
