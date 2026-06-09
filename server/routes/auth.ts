import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 检查是否首次使用
router.get('/check', (_req: Request, res: Response) => {
  const isFirst = repo.isFirstTime()
  res.json({ isFirstTime: isFirst })
})

// 首次设置密码
router.post('/setup', (req: Request, res: Response) => {
  const { passwordHash } = req.body
  if (!passwordHash) {
    res.status(400).json({ error: '缺少密码' })
    return
  }
  if (!repo.isFirstTime()) {
    res.status(400).json({ error: '密码已设置过' })
    return
  }
  repo.setPasswordHash(passwordHash)
  const token = crypto.randomUUID()
  repo.createSession(token)
  res.json({ ok: true, token })
})

// 登录
router.post('/login', (req: Request, res: Response) => {
  const { passwordHash } = req.body
  if (!passwordHash) {
    res.status(400).json({ error: '缺少密码' })
    return
  }
  const stored = repo.getPasswordHash()
  if (!stored) {
    res.status(400).json({ error: '尚未设置密码' })
    return
  }
  if (passwordHash !== stored) {
    res.status(401).json({ error: '密码错误' })
    return
  }
  const token = crypto.randomUUID()
  repo.createSession(token)
  res.json({ ok: true, token })
})

// 验证 token
router.get('/verify', authMiddleware, (_req: Request, res: Response) => {
  res.json({ ok: true })
})

// 登出
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const token = (req as any).token
  repo.deleteSession(token)
  res.json({ ok: true })
})

export default router
