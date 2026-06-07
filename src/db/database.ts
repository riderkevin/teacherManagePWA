import Dexie, { type Table } from 'dexie'
import type { Student, Lesson, Material } from '../types'
import { parseStartTime } from '../types'

// ── 数据库类 ──
class TeacherDB extends Dexie {
  students!: Table<Student, number>
  lessons!: Table<Lesson, number>
  materials!: Table<Material, number>

  constructor() {
    super('teacherManage')

    this.version(4).stores({
      students: '++id, wechatNickname, status',
      lessons: '++id, studentId, startTime, status, month, week',
      materials: '++id, category, difficulty',
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
