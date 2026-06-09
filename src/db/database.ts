import Dexie, { type Table } from 'dexie'
import type { Student, Lesson, Material, Payment, LessonMaterial } from '../types'

// ── 数据库类 ──
class TeacherDB extends Dexie {
  students!: Table<Student, number>
  lessons!: Table<Lesson, number>
  materials!: Table<Material, number>
  payments!: Table<Payment, number>
  lessonMaterials!: Table<LessonMaterial, number>

  constructor() {
    super('teacherManage')

    this.version(6).stores({
      students: '++id, wechatNickname, status',
      lessons: '++id, studentId, startTime, status, month, week',
      materials: '++id, category, difficulty',
      payments: '++id, studentId',
      lessonMaterials: '++id, lessonId',
    })
  }
}

export const db = new TeacherDB()

// ── 学生相关查询 ──

/** 获取所有学生 */
export async function getAllStudents() {
  return db.students.orderBy('wechatNickname').toArray()
}

/** 添加学生 */
export async function addStudent(student: Omit<Student, 'id'>) {
  return db.students.add(student as Student)
}

/** 更新学生 */
export async function updateStudent(id: number, changes: Partial<Student>) {
  return db.students.update(id, changes)
}

/** 删除学生 */
export async function deleteStudent(id: number) {
  return db.students.delete(id)
}

/** 删除学生及其所有关联课程（级联删除） */
export async function deleteStudentCascade(id: number) {
  const lessonCount = await db.lessons.where('studentId').equals(id).count()
  await db.lessons.where('studentId').equals(id).delete()
  await db.students.delete(id)
  return lessonCount
}

/** 获取单个学生 */
export async function getStudentById(id: number) {
  return db.students.get(id)
}

// ── 课程相关查询 ──

/** 获取所有课程 */
export async function getAllLessons() {
  return db.lessons.orderBy('startTime').toArray()
}

/** 获取最近 n 天的即将上课（状态为"未上课"） */
export async function getUpcomingLessons(days: number = 3) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(today)
  end.setDate(end.getDate() + days - 1)
  end.setHours(23, 59, 59, 999)

  // 生成日期范围内的 startTime 前缀用于过滤
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
  const endStr = `${end.getFullYear()}/${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}`

  const all = await db.lessons
    .where('startTime')
    .between(todayStr, endStr + '￿', true, true)
    .toArray()

  return all
    .filter((l) => l.status === '未上课')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

/** 获取本周已完成课时数 */
export async function getThisWeekStats() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const mondayStr = `${monday.getFullYear()}/${String(monday.getMonth() + 1).padStart(2, '0')}/${String(monday.getDate()).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

  const all = await db.lessons
    .where('startTime')
    .between(mondayStr, todayStr + '￿', true, true)
    .toArray()

  return all
    .filter((l) => l.status === '已上课')
    .reduce((sum, l) => sum + l.duration, 0)
}

/** 获取本月已完成课时数 */
export async function getThisMonthStats() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDay.setHours(0, 0, 0, 0)

  const firstStr = `${firstDay.getFullYear()}/${String(firstDay.getMonth() + 1).padStart(2, '0')}/${String(firstDay.getDate()).padStart(2, '0')}`
  const nowStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`

  const all = await db.lessons
    .where('startTime')
    .between(firstStr, nowStr + '￿', true, true)
    .toArray()

  return all
    .filter((l) => l.status === '已上课')
    .reduce((sum, l) => sum + l.duration, 0)
}

/** 获取本周收入（已完成课程的收入总和） */
export async function getThisWeekIncome() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const mondayStr = `${monday.getFullYear()}/${String(monday.getMonth() + 1).padStart(2, '0')}/${String(monday.getDate()).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

  const all = await db.lessons
    .where('startTime')
    .between(mondayStr, todayStr + '￿', true, true)
    .toArray()

  return all
    .filter((l) => l.status === '已上课')
    .reduce((sum, l) => sum + (l.income || 0), 0)
}

/** 获取本月收入（已完成课程的收入总和） */
export async function getThisMonthIncome() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDay.setHours(0, 0, 0, 0)

  const firstStr = `${firstDay.getFullYear()}/${String(firstDay.getMonth() + 1).padStart(2, '0')}/${String(firstDay.getDate()).padStart(2, '0')}`
  const nowStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`

  const all = await db.lessons
    .where('startTime')
    .between(firstStr, nowStr + '￿', true, true)
    .toArray()

  return all
    .filter((l) => l.status === '已上课')
    .reduce((sum, l) => sum + (l.income || 0), 0)
}

/** 添加课程 */
export async function addLesson(lesson: Omit<Lesson, 'id'>) {
  return db.lessons.add(lesson as Lesson)
}

/** 更新课程 */
export async function updateLesson(id: number, changes: Partial<Lesson>) {
  return db.lessons.update(id, changes)
}

/** 删除课程 */
export async function deleteLesson(id: number) {
  return db.lessons.delete(id)
}

/** 按月份获取课程 */
export async function getLessonsByMonth(month: string) {
  return db.lessons
    .where('month')
    .equals(month)
    .sortBy('startTime')
}

/** 获取所有有课程的月份列表 */
export async function getLessonMonths() {
  const all = await db.lessons.orderBy('startTime').toArray()
  const months = [...new Set(all.map((l) => l.month))]
  return months.sort((a, b) => b.localeCompare(a)) // 最新月份在前
}

/** 获取某个学生的所有课程（按时间倒序） */
export async function getLessonsByStudentId(studentId: number) {
  return db.lessons
    .where('studentId')
    .equals(studentId)
    .sortBy('startTime')
}

// ── 课件相关查询 ──

/** 获取所有课件 */
export async function getAllMaterials() {
  return db.materials.orderBy('category').toArray()
}

/** 添加课件 */
export async function addMaterial(material: Omit<Material, 'id'>) {
  return db.materials.add(material as Material)
}

/** 更新课件 */
export async function updateMaterial(id: number, changes: Partial<Material>) {
  return db.materials.update(id, changes)
}

/** 删除课件 */
export async function deleteMaterial(id: number) {
  return db.materials.delete(id)
}

// ── 数据导入导出 ──

export interface BackupData {
  version: number
  exportedAt: string
  students: Student[]
  lessons: Lesson[]
  materials: Material[]
  payments?: Payment[]
  lessonMaterials?: LessonMaterial[]
}

/** 导出所有数据为备份对象 */
export async function exportAllData(): Promise<BackupData> {
  const [students, lessons, materials, payments, lessonMaterials] = await Promise.all([
    db.students.toArray(),
    db.lessons.toArray(),
    db.materials.toArray(),
    db.payments.toArray(),
    db.lessonMaterials.toArray(),
  ])
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

/** 导入备份数据（清空现有数据后写入） */
export async function importAllData(data: BackupData) {
  await Promise.all([
    db.students.clear(),
    db.lessons.clear(),
    db.materials.clear(),
    db.payments.clear(),
    db.lessonMaterials.clear(),
  ])
  await Promise.all([
    db.students.bulkAdd(data.students),
    db.lessons.bulkAdd(data.lessons),
    db.materials.bulkAdd(data.materials),
  ])
  if (data.payments?.length) {
    await db.payments.bulkAdd(data.payments)
  }
  if (data.lessonMaterials?.length) {
    await db.lessonMaterials.bulkAdd(data.lessonMaterials)
  }
}

// ── 缴费记录 ──

/** 获取某个学生的所有缴费记录（按日期倒序） */
export async function getPaymentsByStudentId(studentId: number) {
  return db.payments
    .where('studentId')
    .equals(studentId)
    .toArray()
    .then((list) => list.sort((a, b) => b.date.localeCompare(a.date)))
}

/** 添加缴费记录 */
export async function addPayment(payment: Omit<Payment, 'id'>) {
  return db.payments.add(payment as Payment)
}

/** 更新缴费记录 */
export async function updatePayment(id: number, changes: Partial<Payment>) {
  return db.payments.update(id, changes)
}

/** 删除缴费记录 */
export async function deletePayment(id: number) {
  return db.payments.delete(id)
}

/** 计算学生套餐统计 */
export async function getStudentPackageStats(studentId: number) {
  const [payments, lessons] = await Promise.all([
    getPaymentsByStudentId(studentId),
    db.lessons.where('studentId').equals(studentId).toArray(),
  ])

  // 累计缴费总额
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  // 当前套餐剩余课时：取最近一个缴费记录，计算 购买课时数 - 该缴费日期后已消耗课时数
  let currentPackageLabel = ''
  let currentRemaining = 0
  if (payments.length > 0) {
    const latest = payments[0]
    currentPackageLabel = latest.packageLabel
    const consumed = lessons
      .filter((l) => l.lessonType === '正式课多节' && l.status === '已上课' && l.startTime >= latest.date)
      .reduce((sum, l) => sum + l.duration, 0)
    currentRemaining = Math.max(0, latest.lessonCount - consumed)
  }

  return { totalPaid, currentPackageLabel, currentRemaining }
}

// ── 课程附件 ──

/** 获取某节课的所有附件 */
export async function getLessonMaterials(lessonId: number) {
  return db.lessonMaterials.where('lessonId').equals(lessonId).toArray()
}

/** 添加课程附件 */
export async function addLessonMaterial(m: Omit<LessonMaterial, 'id'>) {
  return db.lessonMaterials.add(m as LessonMaterial)
}

/** 删除课程附件 */
export async function deleteLessonMaterial(id: number) {
  return db.lessonMaterials.delete(id)
}
