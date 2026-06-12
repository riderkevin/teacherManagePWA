import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 所有路由都需要认证
router.use(authMiddleware)

// 获取所有学生
router.get('/', (_req: Request, res: Response) => {
  const students = repo.getAllStudents()
  res.json(students)
})

// 获取单个学生
router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const student = repo.getStudentById(id)
  if (!student) {
    res.status(404).json({ error: '学生不存在' })
    return
  }
  res.json(student)
})

// 新增学生
router.post('/', (req: Request, res: Response) => {
  const id = repo.addStudent(req.body)
  res.json({ id })
})

// 更新学生
router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.updateStudent(id, req.body)
  res.json({ ok: true })
})

// 删除学生（级联删除关联课程）
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const lessonCount = repo.deleteStudentCascade(id)
  res.json({ ok: true, lessonCount })
})

// 获取学生课程列表
router.get('/:id/lessons', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const lessons = repo.getLessonsByStudentId(id)
  res.json(lessons)
})

// 获取学生缴费记录
router.get('/:id/payments', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const payments = repo.getPaymentsByStudentId(id)
  res.json(payments)
})

// 获取学生套餐统计
router.get('/:id/stats', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const stats = repo.getStudentPackageStats(id)
  res.json(stats)
})

// 获取学生小程序浏览日志
router.get('/:id/wx-logs', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const logs = repo.getStudentWxLogs(id)
  res.json(logs)
})

export default router
