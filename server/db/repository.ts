import db from './schema'

// ── 类型（与前端 types/index.ts 保持一致） ──

export interface Student {
  id?: number
  wechatNickname: string
  wechatId: string
  isNotSelf: boolean
  actualStudentName: string
  docLink: string
  location: string
  trialPrice: number
  singlePrice: number
  tenPackPrice: number
  twentyPackPrice: number
  notes: string
  firstTrialDate: string
  status: string
  instrumentBackground: string
  musicPreference: string
}

export interface Lesson {
  id?: number
  title: string
  studentId: number
  studentName: string
  startTime: string
  endTime: string
  duration: number
  status: string
  month: string
  week: string
  income: number
  lessonType: string
  packageLabel: string
}

export interface Material {
  id?: number
  content: string
  parentId: number | null
  category: string
  difficulty: number
  fileLink: string
  fileName: string
  targetSpeed: string
  notes: string
}

export interface Payment {
  id?: number
  studentId: number
  studentName: string
  date: string
  amount: number
  packageLabel: string
  lessonCount: number
  notes: string
}

export interface LessonMaterial {
  id?: number
  lessonId: number
  materialId?: number
  text: string
  fileName: string
  fileData: string
  fileLink: string
}

export interface BackupData {
  version: number
  exportedAt: string
  students: Student[]
  lessons: Lesson[]
  materials: Material[]
  payments?: Payment[]
  lessonMaterials?: LessonMaterial[]
}

// ── 辅助：将 SQLite 行转为前端对象 ──

function rowToStudent(row: any): Student {
  return { ...row, isNotSelf: !!row.isNotSelf }
}

function rowToLesson(row: any): Lesson {
  return { ...row }
}

function rowToMaterial(row: any): Material {
  return { ...row, parentId: row.parentId ?? null }
}

function rowToPayment(row: any): Payment {
  return { ...row }
}

function rowToLessonMaterial(row: any): LessonMaterial {
  return { ...row }
}

// ═══════════════════════════════════════════
// 学生相关
// ═══════════════════════════════════════════

export function getAllStudents(): Student[] {
  const rows = db.prepare('SELECT * FROM students ORDER BY wechatNickname').all()
  return rows.map(rowToStudent)
}

export function getStudentById(id: number): Student | undefined {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id)
  return row ? rowToStudent(row) : undefined
}

export function addStudent(student: Omit<Student, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO students (wechatNickname, wechatId, isNotSelf, actualStudentName, docLink, location, trialPrice, singlePrice, tenPackPrice, twentyPackPrice, notes, firstTrialDate, status, instrumentBackground, musicPreference)
    VALUES (@wechatNickname, @wechatId, @isNotSelf, @actualStudentName, @docLink, @location, @trialPrice, @singlePrice, @tenPackPrice, @twentyPackPrice, @notes, @firstTrialDate, @status, @instrumentBackground, @musicPreference)
  `)
  const result = stmt.run({
    ...student,
    isNotSelf: student.isNotSelf ? 1 : 0,
  })
  return Number(result.lastInsertRowid)
}

export function updateStudent(id: number, changes: Partial<Student>): void {
  const fields: string[] = []
  const params: any = { id }

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'id') continue
    fields.push(`${key} = @${key}`)
    params[key] = key === 'isNotSelf' ? (value ? 1 : 0) : value
  }

  if (fields.length === 0) return
  db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = @id`).run(params)
}

export function deleteStudentCascade(id: number): number {
  const lessonCount = (db.prepare('SELECT COUNT(*) as count FROM lessons WHERE studentId = ?').get(id) as any).count
  // 级联删除由外键处理
  db.prepare('DELETE FROM students WHERE id = ?').run(id)
  return lessonCount
}

// ═══════════════════════════════════════════
// 课程相关
// ═══════════════════════════════════════════

export function getAllLessons(): Lesson[] {
  const rows = db.prepare('SELECT * FROM lessons ORDER BY startTime').all()
  return rows.map(rowToLesson)
}

export function getLessonsByStudentId(studentId: number): Lesson[] {
  const rows = db.prepare('SELECT * FROM lessons WHERE studentId = ? ORDER BY startTime').all(studentId)
  return rows.map(rowToLesson)
}

export function getUpcomingLessons(days: number = 3): Lesson[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + days - 1)
  end.setHours(23, 59, 59, 999)

  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
  const endStr = `${end.getFullYear()}/${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}`
  const endStrMax = endStr + '￿'

  const rows = db.prepare(
    'SELECT * FROM lessons WHERE startTime >= ? AND startTime <= ? ORDER BY startTime'
  ).all(todayStr, endStrMax)
  return rows.map(rowToLesson).filter((l: Lesson) => l.status === '未上课')
}

export function getLessonsByMonth(month: string): Lesson[] {
  const rows = db.prepare('SELECT * FROM lessons WHERE month = ? ORDER BY startTime').all(month)
  return rows.map(rowToLesson)
}

export function getLessonMonths(): string[] {
  const rows = db.prepare('SELECT DISTINCT month FROM lessons ORDER BY startTime DESC').all() as any[]
  const months = rows.map((r) => r.month)
  // 按时间倒序排列月份
  return months.sort((a, b) => b.localeCompare(a))
}

export function addLesson(lesson: Omit<Lesson, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO lessons (title, studentId, studentName, startTime, endTime, duration, status, month, week, income, lessonType, packageLabel)
    VALUES (@title, @studentId, @studentName, @startTime, @endTime, @duration, @status, @month, @week, @income, @lessonType, @packageLabel)
  `)
  const result = stmt.run(lesson)
  return Number(result.lastInsertRowid)
}

export function updateLesson(id: number, changes: Partial<Lesson>): void {
  const fields: string[] = []
  const params: any = { id }

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'id') continue
    fields.push(`${key} = @${key}`)
    params[key] = value
  }

  if (fields.length === 0) return
  db.prepare(`UPDATE lessons SET ${fields.join(', ')} WHERE id = @id`).run(params)
}

export function deleteLesson(id: number): void {
  db.prepare('DELETE FROM lessons WHERE id = ?').run(id)
}

// ═══════════════════════════════════════════
// 统计相关
// ═══════════════════════════════════════════

export function getThisWeekStats(): number {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const mondayStr = `${monday.getFullYear()}/${String(monday.getMonth() + 1).padStart(2, '0')}/${String(monday.getDate()).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
  const todayStrMax = todayStr + '￿'

  const rows = db.prepare(
    "SELECT * FROM lessons WHERE startTime >= ? AND startTime <= ? AND status = '已上课'"
  ).all(mondayStr, todayStrMax) as any[]
  return rows.reduce((sum, l) => sum + l.duration, 0)
}

export function getThisMonthStats(): number {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDay.setHours(0, 0, 0, 0)

  const firstStr = `${firstDay.getFullYear()}/${String(firstDay.getMonth() + 1).padStart(2, '0')}/${String(firstDay.getDate()).padStart(2, '0')}`
  const nowStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  const nowStrMax = nowStr + '￿'

  const rows = db.prepare(
    "SELECT * FROM lessons WHERE startTime >= ? AND startTime <= ? AND status = '已上课'"
  ).all(firstStr, nowStrMax) as any[]
  return rows.reduce((sum, l) => sum + l.duration, 0)
}

export function getThisWeekIncome(): number {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const mondayStr = `${monday.getFullYear()}/${String(monday.getMonth() + 1).padStart(2, '0')}/${String(monday.getDate()).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
  const todayStrMax = todayStr + '￿'

  const rows = db.prepare(
    "SELECT * FROM lessons WHERE startTime >= ? AND startTime <= ? AND status = '已上课'"
  ).all(mondayStr, todayStrMax) as any[]
  return rows.reduce((sum, l) => sum + (l.income || 0), 0)
}

export function getThisMonthIncome(): number {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDay.setHours(0, 0, 0, 0)

  const firstStr = `${firstDay.getFullYear()}/${String(firstDay.getMonth() + 1).padStart(2, '0')}/${String(firstDay.getDate()).padStart(2, '0')}`
  const nowStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  const nowStrMax = nowStr + '￿'

  const rows = db.prepare(
    "SELECT * FROM lessons WHERE startTime >= ? AND startTime <= ? AND status = '已上课'"
  ).all(firstStr, nowStrMax) as any[]
  return rows.reduce((sum, l) => sum + (l.income || 0), 0)
}

// ═══════════════════════════════════════════
// 课件相关
// ═══════════════════════════════════════════

export function getAllMaterials(): Material[] {
  const rows = db.prepare('SELECT * FROM materials ORDER BY category').all()
  return rows.map(rowToMaterial)
}

export function addMaterial(material: Omit<Material, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO materials (content, parentId, category, difficulty, fileLink, fileName, targetSpeed, notes)
    VALUES (@content, @parentId, @category, @difficulty, @fileLink, @fileName, @targetSpeed, @notes)
  `)
  const result = stmt.run(material)
  return Number(result.lastInsertRowid)
}

export function updateMaterial(id: number, changes: Partial<Material>): void {
  const fields: string[] = []
  const params: any = { id }

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'id') continue
    fields.push(`${key} = @${key}`)
    params[key] = value
  }

  if (fields.length === 0) return
  db.prepare(`UPDATE materials SET ${fields.join(', ')} WHERE id = @id`).run(params)
}

export function deleteMaterial(id: number): void {
  db.prepare('DELETE FROM materials WHERE id = ?').run(id)
}

// ═══════════════════════════════════════════
// 缴费记录
// ═══════════════════════════════════════════

export function getPaymentsByStudentId(studentId: number): Payment[] {
  const rows = db.prepare('SELECT * FROM payments WHERE studentId = ?').all(studentId)
  return rows.map(rowToPayment).sort((a, b) => b.date.localeCompare(a.date))
}

export function addPayment(payment: Omit<Payment, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO payments (studentId, studentName, date, amount, packageLabel, lessonCount, notes)
    VALUES (@studentId, @studentName, @date, @amount, @packageLabel, @lessonCount, @notes)
  `)
  const result = stmt.run(payment)
  return Number(result.lastInsertRowid)
}

export function updatePayment(id: number, changes: Partial<Payment>): void {
  const fields: string[] = []
  const params: any = { id }

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'id') continue
    fields.push(`${key} = @${key}`)
    params[key] = value
  }

  if (fields.length === 0) return
  db.prepare(`UPDATE payments SET ${fields.join(', ')} WHERE id = @id`).run(params)
}

export function deletePayment(id: number): void {
  db.prepare('DELETE FROM payments WHERE id = ?').run(id)
}

export function getStudentPackageStats(studentId: number): {
  totalPaid: number
  currentPackageLabel: string
  currentRemaining: number
} {
  const payments = getPaymentsByStudentId(studentId)
  const lessons = db.prepare(
    "SELECT * FROM lessons WHERE studentId = ? AND lessonType = '正式课多节' AND status = '已上课'"
  ).all(studentId) as any[]

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  let currentPackageLabel = ''
  let currentRemaining = 0
  if (payments.length > 0) {
    const latest = payments[0]
    currentPackageLabel = latest.packageLabel
    const consumed = lessons
      .filter((l: any) => l.startTime >= latest.date)
      .reduce((sum: number, l: any) => sum + l.duration, 0)
    currentRemaining = Math.max(0, latest.lessonCount - consumed)
  }

  return { totalPaid, currentPackageLabel, currentRemaining }
}

// ═══════════════════════════════════════════
// 课程附件
// ═══════════════════════════════════════════

export function getLessonMaterials(lessonId: number): LessonMaterial[] {
  const rows = db.prepare('SELECT * FROM lesson_materials WHERE lessonId = ?').all(lessonId)
  return rows.map(rowToLessonMaterial)
}

export function addLessonMaterial(m: Omit<LessonMaterial, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO lesson_materials (lessonId, materialId, text, fileName, fileData, fileLink)
    VALUES (@lessonId, @materialId, @text, @fileName, @fileData, @fileLink)
  `)
  const result = stmt.run(m)
  return Number(result.lastInsertRowid)
}

export function deleteLessonMaterial(id: number): void {
  db.prepare('DELETE FROM lesson_materials WHERE id = ?').run(id)
}

// ═══════════════════════════════════════════
// 导入导出
// ═══════════════════════════════════════════

export function exportAllData(): BackupData {
  const students = db.prepare('SELECT * FROM students').all().map(rowToStudent)
  const lessons = db.prepare('SELECT * FROM lessons').all().map(rowToLesson)
  const materials = db.prepare('SELECT * FROM materials').all().map(rowToMaterial)
  const payments = db.prepare('SELECT * FROM payments').all().map(rowToPayment)
  const lessonMaterials = db.prepare('SELECT * FROM lesson_materials').all().map(rowToLessonMaterial)

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    students,
    lessons,
    materials,
    payments,
    lessonMaterials,
  }
}

export function importAllData(data: BackupData): void {
  const clearAll = db.transaction(() => {
    db.prepare('DELETE FROM lesson_materials').run()
    db.prepare('DELETE FROM payments').run()
    db.prepare('DELETE FROM lessons').run()
    db.prepare('DELETE FROM materials').run()
    db.prepare('DELETE FROM students').run()
  })
  clearAll()

  const importAll = db.transaction(() => {
    const insertStudent = db.prepare(`
      INSERT INTO students (id, wechatNickname, wechatId, isNotSelf, actualStudentName, docLink, location, trialPrice, singlePrice, tenPackPrice, twentyPackPrice, notes, firstTrialDate, status, instrumentBackground, musicPreference)
      VALUES (@id, @wechatNickname, @wechatId, @isNotSelf, @actualStudentName, @docLink, @location, @trialPrice, @singlePrice, @tenPackPrice, @twentyPackPrice, @notes, @firstTrialDate, @status, @instrumentBackground, @musicPreference)
    `)
    for (const s of data.students) {
      insertStudent.run({ ...s, isNotSelf: s.isNotSelf ? 1 : 0 })
    }

    const insertLesson = db.prepare(`
      INSERT INTO lessons (title, studentId, studentName, startTime, endTime, duration, status, month, week, income, lessonType, packageLabel)
      VALUES (@title, @studentId, @studentName, @startTime, @endTime, @duration, @status, @month, @week, @income, @lessonType, @packageLabel)
    `)
    for (const l of data.lessons) {
      insertLesson.run(l)
    }

    const insertMaterial = db.prepare(`
      INSERT INTO materials (content, parentId, category, difficulty, fileLink, fileName, targetSpeed, notes)
      VALUES (@content, @parentId, @category, @difficulty, @fileLink, @fileName, @targetSpeed, @notes)
    `)
    for (const m of data.materials) {
      insertMaterial.run(m)
    }

    if (data.payments?.length) {
      const insertPayment = db.prepare(`
        INSERT INTO payments (studentId, studentName, date, amount, packageLabel, lessonCount, notes)
        VALUES (@studentId, @studentName, @date, @amount, @packageLabel, @lessonCount, @notes)
      `)
      for (const p of data.payments) {
        insertPayment.run(p)
      }
    }

    if (data.lessonMaterials?.length) {
      const insertLM = db.prepare(`
        INSERT INTO lesson_materials (lessonId, materialId, text, fileName, fileData, fileLink)
        VALUES (@lessonId, @materialId, @text, @fileName, @fileData, @fileLink)
      `)
      for (const lm of data.lessonMaterials) {
        insertLM.run(lm)
      }
    }
  })
  importAll()
}

// ═══════════════════════════════════════════
// 认证相关
// ═══════════════════════════════════════════

export function getPasswordHash(): string {
  const row = db.prepare('SELECT passwordHash FROM auth WHERE id = 1').get() as any
  return row?.passwordHash || ''
}

export function setPasswordHash(hash: string): void {
  const existing = db.prepare('SELECT id FROM auth WHERE id = 1').get()
  if (existing) {
    db.prepare('UPDATE auth SET passwordHash = ? WHERE id = 1').run(hash)
  } else {
    db.prepare('INSERT INTO auth (id, passwordHash) VALUES (1, ?)').run(hash)
  }
}

export function isFirstTime(): boolean {
  const row = db.prepare('SELECT passwordHash FROM auth WHERE id = 1').get() as any
  return !row || !row.passwordHash
}

export function createSession(token: string): void {
  db.prepare('INSERT OR REPLACE INTO sessions (token, createdAt) VALUES (?, ?)').run(
    token,
    new Date().toISOString()
  )
}

export function validateSession(token: string): boolean {
  const row = db.prepare('SELECT token FROM sessions WHERE token = ?').get(token)
  return !!row
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}
