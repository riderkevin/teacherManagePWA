import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// 获取课程附件
router.get('/:lessonId', (req: Request, res: Response) => {
  const lessonId = Number(req.params.lessonId)
  const materials = repo.getLessonMaterials(lessonId)
  res.json(materials)
})

// 添加课程附件
router.post('/', (req: Request, res: Response) => {
  const id = repo.addLessonMaterial(req.body)
  res.json({ id })
})

// 删除课程附件
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.deleteLessonMaterial(id)
  res.json({ ok: true })
})

export default router
