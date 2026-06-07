// 学生
export interface Student {
  id?: number
  wechatNickname: string
  wechatId: string
  isNotSelf: boolean // 非本人上课
  actualStudentName: string // 非本人上课时填的学生名称
  // 计算字段：学生名称 = isNotSelf ? actualStudentName : wechatNickname
  progress: string // 目前进度（仅算正式课）
  docLink: string // 文档链接
  location: string // 上课地点
  trialPrice: number // 试听课价格
  singlePrice: number // 正式课单次价格
  tenPackPrice: number // 正式课10次一报价格
  twentyPackPrice: number // 正式课20次一报价格
  notes: string // 备注
  firstTrialDate: string // 首节试听课日期
  status: StudentStatus
  instrumentBackground: string // 器乐基础
  musicPreference: string // 音乐偏好
}

export type StudentStatus =
  | '正式课多节一付'
  | '正式课单节一付'
  | '仅上试听课'
  | '未上课'
  | '0号学生'

/** 计算学生显示名称 */
export function getStudentDisplayName(s: Student): string {
  return s.isNotSelf ? s.actualStudentName : s.wechatNickname
}

// 课程记录
export type LessonStatus = '未上课' | '已上课' | '放鸽子'

export interface Lesson {
  id?: number
  title: string            // 日程名称 = 吉他课-【studentName】
  studentId: number        // 关联学生ID
  studentName: string      // 关联学生显示名称（冗余存储，便于列表展示）
  startTime: string        // 开始时间 YYYY/MM/DD HH:MM
  endTime: string          // 结束时间 = startTime + duration
  duration: number         // 时长（小时），默认1
  status: LessonStatus
  month: string            // 月份，如 2026年6月
  week: string             // 周，如 2026年6月第1周
}

// 课件
export type MaterialCategory =
  | '演奏技法'
  | '乐理'
  | '曲目与乐段'
  | '机能与节奏感'
  | '设备知识'
  | '软件使用'

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  '演奏技法',
  '乐理',
  '曲目与乐段',
  '机能与节奏感',
  '设备知识',
  '软件使用',
]

export interface Material {
  id?: number
  content: string            // 教学内容
  parentId: number | null    // null=一级内容主题, 数字=属于该父级的子练习
  category: MaterialCategory // 分类（演奏技法/乐理…）
  difficulty: number         // 难度 1-10 星
  fileLink: string           // 课件链接（飞书文档URL 或 本地文件dataURL）
  fileName: string           // 上传的本地文件名（仅上传文件时有值）
  targetSpeed: string        // 目标速度
  notes: string              // 备注
}

// 统计数据
export interface LessonStats {
  thisWeek: number
  thisMonth: number
}

// ── 时间计算辅助函数 ──

/** 格式化开始时间 */
export function formatStartTime(date: Date, hours: number, minutes: number): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  return `${y}/${m}/${d} ${hh}:${mm}`
}

/** 计算结束时间（startTime + duration小时） */
export function calcEndTime(startTime: string, durationHours: number): string {
  const [datePart, timePart] = startTime.split(' ')
  const [y, m, d] = datePart.split('/').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh + Math.floor(durationHours), mm + (durationHours % 1) * 60)
  return formatStartTime(dt, dt.getHours(), dt.getMinutes())
}

/** 从 startTime 提取月份字符串 */
export function extractMonth(startTime: string): string {
  const [datePart] = startTime.split(' ')
  const [y, m] = datePart.split('/').map(Number)
  return `${y}年${m}月`
}

/** 从 startTime 提取周字符串（当月第几周，周一为周首） */
export function extractWeek(startTime: string): string {
  const [datePart] = startTime.split(' ')
  const [y, m, d] = datePart.split('/').map(Number)
  const date = new Date(y, m - 1, d)
  // 当月第一天
  const firstDay = new Date(y, m - 1, 1)
  // 当月第一天是周几（周一=0）
  const firstDow = (firstDay.getDay() + 6) % 7
  // 当前日期在当月的第几周（周一为周首）
  const dayOfMonth = date.getDate()
  const weekNum = Math.ceil((dayOfMonth + firstDow) / 7)
  return `${y}年${m}月第${weekNum}周`
}

/** 解析 startTime 为 Date 对象 */
export function parseStartTime(startTime: string): Date {
  const [datePart, timePart] = startTime.split(' ')
  const [y, m, d] = datePart.split('/').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}
