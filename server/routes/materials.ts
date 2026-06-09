import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// 获取所有课件
router.get('/', (_req: Request, res: Response) => {
  const materials = repo.getAllMaterials()
  res.json(materials)
})

// 新增课件
router.post('/', (req: Request, res: Response) => {
  const id = repo.addMaterial(req.body)
  res.json({ id })
})

// 更新课件
router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.updateMaterial(id, req.body)
  res.json({ ok: true })
})

// 删除课件（级联删除子练习）
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  // 删除子练习
  const all = repo.getAllMaterials()
  for (const m of all) {
    if (m.parentId === id) repo.deleteMaterial(m.id!)
  }
  repo.deleteMaterial(id)
  res.json({ ok: true })
})

export default router
