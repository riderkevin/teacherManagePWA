import { Router, type Request, type Response } from 'express'
import * as repo from '../db/repository'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// 本周统计
router.get('/week', (_req: Request, res: Response) => {
  const lessons = repo.getThisWeekStats()
  const income = repo.getThisWeekIncome()
  res.json({ lessons, income })
})

// 本月统计
router.get('/month', (_req: Request, res: Response) => {
  const lessons = repo.getThisMonthStats()
  const income = repo.getThisMonthIncome()
  res.json({ lessons, income })
})

// 年度 + 累计统计
router.get('/summary', (_req: Request, res: Response) => {
  const yearIncome = repo.getThisYearIncome()
  const totalIncome = repo.getTotalIncome()
  const newStudents = repo.getNewStudentsThisMonth()
  const renewalStudents = repo.getRenewalStudentsThisMonth()
  const formalCount = repo.getFormalStudentCount()
  const trialCount = repo.getTrialStudentCount()
  const newFormal = repo.getNewFormalStudentsThisMonth()
  const newTrial = repo.getNewTrialStudentsThisMonth()
  res.json({ yearIncome, totalIncome, newStudents, renewalStudents, formalCount, trialCount, newFormal, newTrial })
})

// 导出所有数据
router.get('/export', (_req: Request, res: Response) => {
  const data = repo.exportAllData()
  res.json(data)
})

// 导入数据
router.post('/import', (req: Request, res: Response) => {
  try {
    const data = req.body
    if (!data.students || !data.lessons || !data.materials) {
      res.status(400).json({ error: '备份文件格式不正确，缺少必要的数据表' })
      return
    }
    repo.importAllData(data)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
