import { Router, type Request, type Response } from 'express'
import db from '../db/schema'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// ═══════════════════════════════════════════
// 小程序端接口（通过 openid 鉴权，学生只能看自己的数据）
// ═══════════════════════════════════════════

// 小程序登录/绑定校验中间件 —— 从 header 取 openid，查绑定表确认身份
function wxAuth(req: Request, res: Response, next: Function) {
  const openid = req.headers['x-wx-openid'] as string
  if (!openid) {
    res.status(401).json({ error: '未登录' })
    return
  }
  const binding = db.prepare(
    'SELECT * FROM student_wx_bindings WHERE wxOpenid = ? AND isBound = 1'
  ).get(openid) as any
  if (!binding) {
    res.status(403).json({ error: '未绑定学生，请先输入绑定码' })
    return
  }
  ;(req as any).studentId = binding.studentId
  ;(req as any).openid = openid
  next()
}

// ── 绑定码输入 ──
// POST /api/wx/bind
// body: { code: "ABC123" }
// header: x-wx-openid: <openid>
router.post('/bind', (req: Request, res: Response) => {
  const openid = (req.headers['x-wx-openid'] as string) || ''
  const { code } = req.body

  if (!openid) {
    res.status(400).json({ error: '无法获取用户标识' })
    return
  }
  if (!code) {
    res.status(400).json({ error: '请输入绑定码' })
    return
  }

  // 查找绑定码
  const bindCode = db.prepare(
    'SELECT * FROM bind_codes WHERE code = ? AND used = 0'
  ).get(code.toUpperCase().trim()) as any

  if (!bindCode) {
    res.status(400).json({ error: '绑定码无效或已使用' })
    return
  }

  // 检查是否已绑定
  const existing = db.prepare(
    'SELECT * FROM student_wx_bindings WHERE studentId = ?'
  ).get(bindCode.studentId) as any

  // 更新或插入绑定
  if (existing) {
    db.prepare(`
      UPDATE student_wx_bindings
      SET wxOpenid = ?, isBound = 1, boundAt = ?
      WHERE studentId = ?
    `).run(openid, new Date().toISOString(), bindCode.studentId)
  } else {
    db.prepare(`
      INSERT INTO student_wx_bindings (studentId, wxOpenid, wxNickname, wxAvatarUrl, isBound, boundAt)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(bindCode.studentId, openid, '', '', new Date().toISOString())
  }

  // 标记邀请码为已使用
  db.prepare('UPDATE bind_codes SET used = 1, wxOpenid = ? WHERE code = ?').run(openid, code)

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(bindCode.studentId) as any
  res.json({
    ok: true,
    studentId: bindCode.studentId,
    studentName: bindCode.studentName,
    isNotSelf: student?.isNotSelf ? true : false,
  })
})

// ── 获取学生自己的档案 ──
router.get('/profile', wxAuth, (req: Request, res: Response) => {
  const studentId = (req as any).studentId
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any
  if (!student) {
    res.status(404).json({ error: '学生不存在' })
    return
  }

  // 去除敏感字段
  res.json({
    id: student.id,
    displayName: student.isNotSelf ? student.actualStudentName : student.wechatNickname,
    wechatNickname: student.wechatNickname,
    isNotSelf: !!student.isNotSelf,
    status: student.status,
    location: student.location,
    notes: student.notes,
  })
})

// ── 获取学生的课程列表 ──
router.get('/lessons', wxAuth, (req: Request, res: Response) => {
  const studentId = (req as any).studentId
  const limit = Number(req.query.limit) || 50

  const lessons = db.prepare(`
    SELECT id, title, studentName, startTime, endTime, duration, status, lessonType, month, week
    FROM lessons
    WHERE studentId = ?
    ORDER BY startTime DESC
    LIMIT ?
  `).all(studentId, limit)

  res.json(lessons)
})

// ── 获取即将上的课 ──
router.get('/upcoming', wxAuth, (req: Request, res: Response) => {
  const studentId = (req as any).studentId
  const today = new Date()
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

  const lessons = db.prepare(`
    SELECT id, title, startTime, endTime, duration, lessonType
    FROM lessons
    WHERE studentId = ? AND status = '未上课' AND startTime >= ?
    ORDER BY startTime ASC
  `).all(studentId, todayStr)

  res.json(lessons)
})

// ── 获取课程附件（课件） ──
router.get('/materials/:lessonId', wxAuth, (req: Request, res: Response) => {
  const studentId = (req as any).studentId
  const lessonId = Number(req.params.lessonId)

  // 验证这节课属于该学生
  const lesson = db.prepare('SELECT id FROM lessons WHERE id = ? AND studentId = ?').get(lessonId, studentId)
  if (!lesson) {
    res.status(403).json({ error: '无权访问' })
    return
  }

  const materials = db.prepare('SELECT * FROM lesson_materials WHERE lessonId = ?').all(lessonId)
  res.json(materials)
})

// ── 获取学习进度 ──
router.get('/progress', wxAuth, (req: Request, res: Response) => {
  const studentId = (req as any).studentId

  const allLessons = db.prepare(`
    SELECT * FROM lessons WHERE studentId = ?
  `).all(studentId) as any[]

  const completed = allLessons.filter(l => l.status === '已上课')
  const formal = completed.filter(l => l.lessonType !== '试听课')
  const totalHours = formal.reduce((s, l) => s + l.duration, 0)
  const totalLessons = completed.length

  // 缴费统计
  const payments = db.prepare('SELECT * FROM payments WHERE studentId = ?').all(studentId) as any[]
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  let currentRemaining = 0
  if (payments.length > 0) {
    const latest = payments.sort((a, b) => b.date.localeCompare(a.date))[0]
    const consumed = allLessons
      .filter(l => l.lessonType === '正式课多节' && l.status === '已上课' && l.startTime >= latest.date)
      .reduce((s, l) => s + l.duration, 0)
    currentRemaining = Math.max(0, latest.lessonCount - consumed)
  }

  res.json({
    totalLessons,
    totalHours,
    totalPaid,
    currentRemaining,
  })
})

// ═══════════════════════════════════════════
// 后台管理接口（需要 token 认证）
// ═══════════════════════════════════════════

// ── 生成绑定码 ──
// POST /api/wx/admin/generate-code
router.post('/admin/generate-code', authMiddleware, (req: Request, res: Response) => {
  const { studentId } = req.body
  if (!studentId) {
    res.status(400).json({ error: '缺少学生ID' })
    return
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any
  if (!student) {
    res.status(404).json({ error: '学生不存在' })
    return
  }

  // 生成 6 位随机邀请码（大写字母+数字，排除易混淆字符）
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  const displayName = student.isNotSelf ? student.actualStudentName : student.wechatNickname

  // 删除该学生旧的未使用码
  db.prepare('DELETE FROM bind_codes WHERE studentId = ? AND used = 0').run(studentId)

  // 创建新码
  db.prepare(`
    INSERT INTO bind_codes (code, studentId, studentName, wxOpenid, used, createdAt)
    VALUES (?, ?, ?, '', 0, ?)
  `).run(code, studentId, displayName, new Date().toISOString())

  res.json({ code, studentId, studentName: displayName })
})

// ── 查询绑定状态 ──
// GET /api/wx/admin/binding/:studentId
router.get('/admin/binding/:studentId', authMiddleware, (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId)
  const binding = db.prepare('SELECT * FROM student_wx_bindings WHERE studentId = ?').get(studentId) as any

  if (!binding || !binding.isBound) {
    res.json({ isBound: false })
    return
  }

  res.json({
    isBound: true,
    wxOpenid: binding.wxOpenid,
    wxNickname: binding.wxNickname,
    wxAvatarUrl: binding.wxAvatarUrl,
    boundAt: binding.boundAt,
  })
})

// ── 解除绑定 ──
// DELETE /api/wx/admin/unbind/:studentId
router.delete('/admin/unbind/:studentId', authMiddleware, (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId)
  db.prepare('UPDATE student_wx_bindings SET isBound = 0 WHERE studentId = ?').run(studentId)
  res.json({ ok: true })
})

export default router
