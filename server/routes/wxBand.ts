import { Router, type Request, type Response } from 'express'
import db from '../db/schema'

const router = Router()

// ═══════════════════════════════════════════
// 乐队端小程序接口 —— 公开只读，无需鉴权
// 乐队数据为共享信息，所有乐队成员均可查看
// ═══════════════════════════════════════════

// ── 演出日程列表（带歌单）──
// GET /api/wx-band/performances
router.get('/performances', (_req: Request, res: Response) => {
  const events = db.prepare(
    "SELECT * FROM band_events WHERE type = '演出' ORDER BY date DESC"
  ).all() as any[]

  // 为每个演出附加曲目单
  const result = events.map((event) => {
    const songs = db.prepare(`
      SELECT bes.sortOrder, bs.id, bs.title, bs.artist, bs.ip, bs.version, bs.arrangement, bs.bpm, bs.songKey, bs.duration
      FROM band_event_songs bes
      JOIN band_songs bs ON bes.songId = bs.id
      WHERE bes.eventId = ?
      ORDER BY bes.sortOrder
    `).all(event.id)
    return { ...event, setlist: songs }
  })

  res.json(result)
})

// ── 排练日程列表 ──
// GET /api/wx-band/rehearsals
router.get('/rehearsals', (_req: Request, res: Response) => {
  const events = db.prepare(
    "SELECT * FROM band_events WHERE type = '排练' ORDER BY date DESC"
  ).all()
  res.json(events)
})

// ── 排练歌单 ──
// GET /api/wx-band/songs
router.get('/songs', (_req: Request, res: Response) => {
  const songs = db.prepare('SELECT * FROM band_songs ORDER BY title').all()
  res.json(songs)
})

// ── 歌单曲谱文件（JSON格式）──
// GET /api/wx-band/sheet-data/:id
router.get('/sheet-data/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT * FROM band_songs WHERE id = ?').get(id) as any
  if (!row || !row.sheetData?.startsWith('data:')) {
    res.status(404).json({ error: '曲谱不存在' })
    return
  }
  const matches = (row.sheetData as string).match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    res.status(400).json({ error: '文件格式错误' })
    return
  }
  res.json({ mimeType: matches[1], fileName: row.sheetFileName || '曲谱', base64: matches[2] })
})

// ── 网盘资源列表 ──
// GET /api/wx-band/cloud-files
router.get('/cloud-files', (_req: Request, res: Response) => {
  const files = db.prepare('SELECT * FROM cloud_files ORDER BY createdAt DESC').all()
  res.json(files)
})

// ── 网盘文件数据（JSON格式）──
// GET /api/wx-band/file-data/:id
router.get('/file-data/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT * FROM cloud_files WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({ error: '文件不存在' })
    return
  }

  // 优先返回 fileData（上传文件），其次 fileLink（如果是 data: URL）
  const source = row.fileData || (row.fileLink?.startsWith('data:') ? row.fileLink : '')
  if (!source) {
    res.status(404).json({ error: '无文件内容' })
    return
  }

  const matches = source.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    res.status(400).json({ error: '文件格式错误' })
    return
  }
  res.json({ mimeType: matches[1], fileName: row.fileName || 'file', base64: matches[2] })
})

export default router
