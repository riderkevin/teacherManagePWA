import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// 获取所有课程
router.get('/', (_req: Request, res: Response) => {
  const lessons = repo.getAllLessons()
  res.json(lessons)
})

// 获取即将上课
router.get('/upcoming', (req: Request, res: Response) => {
  const days = Number(req.query.days) || 3
  const lessons = repo.getUpcomingLessons(days)
  res.json(lessons)
})

// 获取月份列表
router.get('/months', (_req: Request, res: Response) => {
  const months = repo.getLessonMonths()
  res.json(months)
})

// 获取单节课
router.get('/:id', (req: Request, res: Response) => {
  const all = repo.getAllLessons()
  const lesson = all.find((l) => l.id === Number(req.params.id))
  if (!lesson) {
    res.status(404).json({ error: '课程不存在' })
    return
  }
  res.json(lesson)
})

// 新增课程
router.post('/', (req: Request, res: Response) => {
  const id = repo.addLesson(req.body)
  res.json({ id })
})

// 更新课程
router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)

  // 先查旧记录，判断是否需要重算
  const all = repo.getAllLessons()
  const old = all.find((l) => l.id === id)

  repo.updateLesson(id, req.body)

  // 如果状态、时长、课程类型、学生变了 → 重算该学生所有正式课课时编号
  const changes = req.body
  const needRecalc =
    (changes.status !== undefined && changes.status !== old?.status) ||
    (changes.duration !== undefined && changes.duration !== old?.duration) ||
    (changes.lessonType !== undefined && changes.lessonType !== old?.lessonType) ||
    (changes.studentId !== undefined && changes.studentId !== old?.studentId)

  const studentId = changes.studentId ?? old?.studentId
  if (needRecalc && studentId) {
    repo.recalculateLessonTitles(studentId)
    // 如果切换到另一个学生，旧学生的也需要重算
    if (changes.studentId && old?.studentId && old.studentId !== changes.studentId) {
      repo.recalculateLessonTitles(old.studentId)
    }
  }

  res.json({ ok: true })
})

// 删除课程
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  repo.deleteLesson(id)
  res.json({ ok: true })
})

export default router
