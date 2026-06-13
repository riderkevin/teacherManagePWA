// 学生
export interface Student {
  id?: number
  wechatNickname: string
  wechatId: string
  isNotSelf: boolean // 非本人上课
  actualStudentName: string // 非本人上课时填的学生名称
  // 学生名称 = isNotSelf ? actualStudentName : wechatNickname（计算字段，不可编辑）
  // 目前进度 = 根据上课记录自动计算（计算字段，不可编辑）
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
  income: number           // 课时收入（元），试听课/正式课单节时填写，正式课多节为0
  lessonType: LessonType   // 课程类型
  packageLabel: string     // 正式课多节时的套餐标签，如"正式课一期-10节一付"；其他为空
}

/** 课程类型 */
export type LessonType = '试听课' | '正式课单节' | '正式课多节'

/** 根据学生状态推断默认课程类型 */
export function inferLessonType(status: StudentStatus): LessonType {
  if (status === '仅上试听课') return '试听课'
  if (status === '正式课单节一付') return '正式课单节'
  return '正式课多节'
}

/** 课程附件（关联到具体课程记录的课件） */
export interface LessonMaterial {
  id?: number
  lessonId: number
  materialId?: number    // 从课件库选择的条目ID
  text: string           // 文字内容（手写备注 或 课件库条目的content副本）
  fileName: string       // 上传的文件名
  fileData: string       // 上传的文件 base64 dataURL
  fileLink: string       // 飞书链接或其他URL
}

/** 缴费记录 */
export interface Payment {
  id?: number
  studentId: number
  studentName: string
  date: string            // 缴费日期 YYYY/MM/DD
  amount: number          // 缴费金额
  packageLabel: string    // 如 "正式课一期"
  lessonCount: number     // 节数，如 10
  notes: string           // 备注
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

/**
 * 根据上课记录自动计算学生「目前进度」
 * 规则：
 * 1. 无上课记录 → "未上课"
 * 2. 最新一条是试听课 → "仅上试听课"
 * 3. 最新一条是正式课单节 → "正式课单节-总课时X"
 * 4. 最新一条是正式课多节 → "正式课多节N期-总课时X"
 *
 * 总课时展示逻辑：
 * - 若每节课都是1课时（duration=1），显示总计数，如 "总课时12"
 * - 若存在多课时课程（duration>1），则逐课时编号列出，如 "总课时1、2、3、…"
 */
export function computeProgress(lessons: Lesson[]): string {
  if (lessons.length === 0) return '未上课'

  // 按开始时间倒序，取最新一条
  const sorted = [...lessons].sort((a, b) => b.startTime.localeCompare(a.startTime))
  const latest = sorted[0]

  // 已上课且非试听课的课程（按时间正序）
  const formalLessons = [...lessons]
    .filter((l) => l.status === '已上课' && l.lessonType !== '试听课')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (latest.lessonType === '试听课') return '仅上试听课'

  // 构建总课时显示
  const totalDisplay = buildTotalDisplay(formalLessons)

  if (latest.lessonType === '正式课单节') {
    return `正式课单节-${totalDisplay}`
  }

  if (latest.lessonType === '正式课多节') {
    const packages = new Set(
      lessons
        .filter((l) => l.lessonType === '正式课多节' && l.packageLabel)
        .map((l) => l.packageLabel),
    )
    return `正式课多节${packages.size}期-${totalDisplay}`
  }

  // 兜底：有课但类型未知
  return totalDisplay
}

/** 构建总课时显示文本 */
function buildTotalDisplay(lessons: Lesson[]): string {
  if (lessons.length === 0) return '总课时0'

  // 最新一次正式课（列表已按时间正序，取最后一条）
  const latest = lessons[lessons.length - 1]

  if (latest.duration === 1) {
    // 单课时：显示总计数
    const total = lessons.reduce((sum, l) => sum + l.duration, 0)
    return `总课时${total}`
  }

  // 多课时：只写最近这一次的课时编号
  // 计算这一节课之前的累计课时数 + 1 即为其起始编号
  const before = lessons.slice(0, -1).reduce((sum, l) => sum + l.duration, 0)
  const numbers: number[] = []
  for (let i = 0; i < latest.duration; i++) {
    numbers.push(before + i + 1)
  }
  return `总课时${numbers.join('、')}`
}

// ── 乐队网盘资源 ──

export type CloudFileCategory = '乐谱' | '音频' | '文档' | '伴奏' | '其他'

export const CLOUD_FILE_CATEGORIES: CloudFileCategory[] = [
  '乐谱', '音频', '文档', '伴奏', '其他',
]

export interface CloudFile {
  id?: number
  title: string
  category: CloudFileCategory
  fileName: string
  fileData: string
  fileLink: string
  notes: string
  createdAt: string
}

// 小程序浏览日志
export interface WxLog {
  id?: number
  studentId: number
  event: string     // '绑定' | '解绑' | '访问课件'
  detail: string    // 详细信息
  createdAt: string // ISO 时间戳
}

// ═══════════════════════════════════════════
// 乐队管理
// ═══════════════════════════════════════════

export type BandEventType = '演出' | '排练'

export interface BandEvent {
  id?: number
  type: BandEventType
  title: string
  date: string           // YYYY/MM/DD
  startTime: string      // HH:MM
  endTime: string        // HH:MM
  duration: number       // 时长（小时）
  location: string
  notes: string
  createdAt: string
}

export interface BandSong {
  id?: number
  title: string
  artist: string
  duration: string
  songKey: string
  notes: string
}

export interface BandEventSong {
  id?: number
  eventId: number
  songId: number
  sortOrder: number
  // JOIN fields
  songTitle?: string
  songArtist?: string
}
