import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// ═══════════════════════════════════════════
// 日程
// ═══════════════════════════════════════════

router.get('/events', (_req: Request, res: Response) => {
  const events = repo.getAllBandEvents()
  res.json(events)
})

router.post('/events', (req: Request, res: Response) => {
  const id = repo.addBandEvent(req.body)
  res.json({ id })
})

router.put('/events/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.updateBandEvent(id, req.body)
  res.json({ ok: true })
})

router.delete('/events/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.deleteBandEvent(id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════
// 曲目
// ═══════════════════════════════════════════

router.get('/songs', (_req: Request, res: Response) => {
  const songs = repo.getAllBandSongs()
  res.json(songs)
})

router.post('/songs', (req: Request, res: Response) => {
  const id = repo.addBandSong(req.body)
  res.json({ id })
})

router.put('/songs/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.updateBandSong(id, req.body)
  res.json({ ok: true })
})

router.delete('/songs/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.deleteBandSong(id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════
// 曲目单
// ═══════════════════════════════════════════

router.get('/events/:id/songs', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const songs = repo.getBandEventSongs(id)
  res.json(songs)
})

router.post('/events/:id/songs', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { songIds } = req.body
  if (!Array.isArray(songIds)) {
    res.status(400).json({ error: 'songIds 必须是数组' })
    return
  }
  repo.setBandEventSongs(id, songIds)
  res.json({ ok: true })
})

export default router
