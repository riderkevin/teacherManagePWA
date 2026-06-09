import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// 新增缴费记录
router.post('/', (req: Request, res: Response) => {
  const id = repo.addPayment(req.body)
  res.json({ id })
})

// 更新缴费记录
router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.updatePayment(id, req.body)
  res.json({ ok: true })
})

// 删除缴费记录
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.deletePayment(id)
  res.json({ ok: true })
})

export default router
