import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// 获取所有网盘资源
router.get('/', (_req: Request, res: Response) => {
  res.json(repo.getAllCloudFiles())
})

// 新增资源
router.post('/', (req: Request, res: Response) => {
  const id = repo.addCloudFile(req.body)
  res.json({ id })
})

// 更新资源
router.put('/:id', (req: Request, res: Response) => {
  repo.updateCloudFile(Number(req.params.id), req.body)
  res.json({ ok: true })
})

// 删除资源
router.delete('/:id', (req: Request, res: Response) => {
  repo.deleteCloudFile(Number(req.params.id))
  res.json({ ok: true })
})

export default router
