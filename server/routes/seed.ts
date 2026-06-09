import { Router, type Request, type Response } from 'express'
import db from '../db/schema'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 所有种子操作需要认证
router.use(authMiddleware)

// ── 日期格式化辅助 ──
function dt(y: number, m: number, d: number, hh = 0, mm = 0): Date {
  return new Date(y, m - 1, d, hh, mm)
}

function fmt(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${mo}/${d} ${hh}:${mm}`
}

function calcEndTime(startTime: string, durationHours: number): string {
  const [datePart, timePart] = startTime.split(' ')
  const [y, m, d] = datePart.split('/').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh + Math.floor(durationHours), mm + (durationHours % 1) * 60)
  return fmt(dt)
}

function extractMonth(startTime: string): string {
  const [datePart] = startTime.split(' ')
  const [y, m] = datePart.split('/').map(Number)
  return `${y}年${m}月`
}

function extractWeek(startTime: string): string {
  const [datePart] = startTime.split(' ')
  const [y, m, d] = datePart.split('/').map(Number)
  const date = new Date(y, m - 1, d)
  const firstDay = new Date(y, m - 1, 1)
  const firstDow = (firstDay.getDay() + 6) % 7
  const dayOfMonth = date.getDate()
  const weekNum = Math.ceil((dayOfMonth + firstDow) / 7)
  return `${y}年${m}月第${weekNum}周`
}

function weeklyLessons(
  studentId: number,
  studentName: string,
  weekday: number,
  time: string,
  duration: number,
  lessonType: string,
  income: number,
  packageLabel: string,
  from: Date,
  to: Date,
  overrides?: Record<string, Partial<{ status: string; income: number; duration: number }>>,
): any[] {
  const today = new Date(2026, 5, 7)
  today.setHours(0, 0, 0, 0)

  const [h, m] = time.split(':').map(Number)
  const cursor = new Date(from)
  while (cursor.getDay() !== weekday) {
    cursor.setDate(cursor.getDate() + 1)
  }

  let lessonNum = 0
  const lessons: any[] = []

  while (cursor <= to) {
    cursor.setHours(h, m, 0, 0)
    const startTime = fmt(cursor)
    const isPast = cursor < today
    const dateKey = `${cursor.getFullYear()}/${String(cursor.getMonth() + 1).padStart(2, '0')}/${String(cursor.getDate()).padStart(2, '0')}`

    const override = overrides?.[dateKey] || {}
    const d = override.duration ?? duration
    const s = override.status ?? (isPast ? '已上课' : '未上课')
    const inc = lessonType !== '正式课多节' && s === '已上课' ? (override.income ?? income) : 0

    const isFormal = lessonType !== '试听课' && s !== '放鸽子'
    const typeLabel = lessonType === '试听课' ? '试听课' : '正式课'
    let keciSuffix = ''
    if (isFormal) {
      if (d === 1) {
        keciSuffix = `课时${lessonNum + 1}`
      } else {
        const nums: number[] = []
        for (let i = 0; i < d; i++) nums.push(lessonNum + i + 1)
        keciSuffix = `课时${nums.join('、')}`
      }
      lessonNum += d
    }

    lessons.push({
      title: keciSuffix ? `${studentName}-${typeLabel}-${keciSuffix}` : `${studentName}-${typeLabel}`,
      studentId,
      studentName,
      startTime,
      endTime: calcEndTime(startTime, d),
      duration: d,
      status: s,
      month: extractMonth(startTime),
      week: extractWeek(startTime),
      income: inc,
      lessonType,
      packageLabel: lessonType === '正式课多节' ? packageLabel : '',
    })

    cursor.setDate(cursor.getDate() + 7)
    cursor.setHours(h, m, 0, 0)
  }
  return lessons
}

// POST /api/seed/reset - 重置为演示数据
router.post('/reset', (_req: Request, res: Response) => {
  try {
    // 清空数据
    db.prepare('DELETE FROM lesson_materials').run()
    db.prepare('DELETE FROM payments').run()
    db.prepare('DELETE FROM lessons').run()
    db.prepare('DELETE FROM materials').run()
    db.prepare('DELETE FROM students').run()

    // 重置自增ID
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('students','lessons','materials','payments','lesson_materials')").run()

    // ═══ 学生 ═══
    const insertStudent = db.prepare(`
      INSERT INTO students (wechatNickname, wechatId, isNotSelf, actualStudentName, docLink, location, trialPrice, singlePrice, tenPackPrice, twentyPackPrice, notes, firstTrialDate, status, instrumentBackground, musicPreference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const students = [
      ['吉他少年小王', 'wxid_wang123', 0, '王雨涵', 'https://feishu.cn/doc/example1', '工作室', 0, 300, 2600, 4800, '喜欢指弹风格，每周六上午', '2026/01/10', '正式课多节一付', '自学过半年木吉他', '指弹、日系摇滚'],
      ['音乐老张', 'wxid_zhang456', 1, '张小明', '', '线上', 50, 250, 2200, 4000, '基础不错，已学完基础和弦，每周三下午线上课', '2026/03/01', '正式课单节一付', '零基础', '布鲁斯、硬摇滚'],
      ['Lisa妈妈', 'lisamom789', 1, '陈晓艺', 'https://feishu.cn/doc/example2', '工作室', 0, 350, 3000, 5500, '妈妈负责沟通，课程由爸爸接送', '2025/09/01', '正式课多节一付', '学过2年钢琴', '流行、Funk'],
      ['阿远🎸', 'yuanyuan_guitar', 0, '李思远', '', '学生家', 80, 280, 0, 0, '刚报的试听课，有意向报正式课', '2026/05/20', '仅上试听课', '零基础', '民谣弹唱'],
      ['摇滚老赵', 'zhaoyiming_rock', 0, '赵一鸣', 'https://feishu.cn/doc/zhao', '工作室', 0, 400, 3500, 6000, '学得很快，已能弹《Scarified》前半段，每周二傍晚', '2025/11/15', '正式课多节一付', '自学电吉他2年', '重金属、新古典'],
      ['雨桐妈妈', 'yutong_mom', 1, '刘雨桐', '', '工作室', 50, 280, 2400, 0, '初中生，周五放学后来上课，有点内向但很认真', '2026/04/10', '正式课单节一付', '学过1年尤克里里', 'J-POP、动漫歌曲'],
      ['舟舟', 'sunxiaozhou', 0, '孙小舟', '', '工作室', 80, 260, 0, 0, '朋友介绍来的，上周刚试听完，在考虑是否报正式课', '2026/05/28', '仅上试听课', '零基础', '说唱、Hip-Hop'],
      ['大鹏哥', 'dapeng_666', 0, '周大鹏', '', '线上', 0, 300, 0, 0, '工作太忙，3月后暂停上课，说忙完这阵再回来', '2025/08/20', '0号学生', '弹过几年民谣吉他', '经典摇滚、民谣'],
    ]

    for (const s of students) {
      insertStudent.run(...s)
    }

    // ═══ 课程 ═══
    const RANGE_START = dt(2026, 4, 1)
    const RANGE_END = dt(2026, 6, 23)

    const allLessons: any[] = []

    allLessons.push(...weeklyLessons(1, '吉他少年小王', 6, '10:00', 1, '正式课多节', 300, '正式课一期-10节一付', RANGE_START, RANGE_END, {
      '2026/05/03': { status: '放鸽子', income: 0 },
      '2026/06/14': { duration: 2 },
    }))

    allLessons.push(...weeklyLessons(2, '张小明', 3, '14:00', 2, '正式课单节', 500, '', RANGE_START, RANGE_END, {
      '2026/04/16': { status: '放鸽子', income: 0 },
    }))

    allLessons.push(...weeklyLessons(3, '陈晓艺', 4, '16:00', 1, '正式课多节', 350, '正式课一期-20节一付', RANGE_START, RANGE_END, {
      '2026/05/15': { status: '放鸽子', income: 0 },
      '2026/06/05': { duration: 2 },
    }))

    allLessons.push(...weeklyLessons(4, '阿远🎸', 2, '15:00', 1, '试听课', 80, '', dt(2026, 5, 20), dt(2026, 6, 10)))

    allLessons.push(...weeklyLessons(5, '赵一鸣', 2, '18:00', 2, '正式课多节', 400, '正式课二期-20节一付', RANGE_START, RANGE_END, {
      '2026/04/29': { status: '放鸽子', income: 0 },
    }))

    // 赵一鸣4月属于一期
    const zymLessons = allLessons.filter((l: any) => l.studentId === 5 && l.startTime.startsWith('2026/04'))
    zymLessons.forEach((l: any) => { l.packageLabel = '正式课一期-10节一付' })

    allLessons.push(...weeklyLessons(6, '刘雨桐', 5, '15:00', 1, '正式课单节', 280, '', dt(2026, 4, 11), RANGE_END, {
      '2026/05/09': { status: '放鸽子', income: 0 },
    }))

    allLessons.push(...weeklyLessons(7, '孙小舟', 4, '11:00', 1, '试听课', 80, '', dt(2026, 5, 28), dt(2026, 6, 10)))

    allLessons.push(
      { title: '周大鹏-正式课-课时1', studentId: 8, studentName: '周大鹏', startTime: '2026/04/01 19:00', endTime: '2026/04/01 20:00', duration: 1, status: '已上课', month: '2026年4月', week: '2026年4月第1周', income: 300, lessonType: '正式课单节', packageLabel: '' },
      { title: '周大鹏-正式课-课时2', studentId: 8, studentName: '周大鹏', startTime: '2026/04/08 19:00', endTime: '2026/04/08 20:00', duration: 1, status: '已上课', month: '2026年4月', week: '2026年4月第2周', income: 300, lessonType: '正式课单节', packageLabel: '' },
    )

    const sorted = allLessons.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))

    const insertLesson = db.prepare(`
      INSERT INTO lessons (title, studentId, studentName, startTime, endTime, duration, status, month, week, income, lessonType, packageLabel)
      VALUES (@title, @studentId, @studentName, @startTime, @endTime, @duration, @status, @month, @week, @income, @lessonType, @packageLabel)
    `)
    for (const l of sorted) {
      insertLesson.run(l)
    }

    // ═══ 课件（使用显式 ID 确保父子关系正确） ═══
    const insertMaterial = db.prepare(`
      INSERT INTO materials (id, content, parentId, category, difficulty, fileLink, fileName, targetSpeed, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // 一级主题 (id: 1-9)
    const topics: any[] = [
      [1, '交替拨弦', null, '演奏技法', 3, '', '', '', '经济拨弦、交替拨弦的基础与进阶'],
      [2, '推弦与揉弦', null, '演奏技法', 5, '', '', '', '左手技巧的核心内容'],
      [3, '五声音阶', null, '乐理', 4, '', '', '', '五个指型的位置记忆与串联'],
      [4, 'CAGED系统和弦', null, '乐理', 6, '', '', '', '理解和弦推导体系'],
      [5, '练习曲目', null, '曲目与乐段', 0, '', '', '', '经典曲目分段练习'],
      [6, '节奏训练', null, '机能与节奏感', 3, '', '', '', '节拍器跟练系列'],
      [7, '手指机能', null, '机能与节奏感', 4, '', '', '', '独立性、伸展性训练'],
      [8, '效果器', null, '设备知识', 2, '', '', '', '效果器选择与使用'],
      [9, '软件工具', null, '软件使用', 1, '', '', '', '常用音乐软件教程'],
    ]
    for (const t of topics) insertMaterial.run(...t)

    // 子练习 (id: 10-20)
    const subs: any[] = [
      [10, '经济拨弦练习', 1, '演奏技法', 3, 'https://feishu.cn/doc/alt-picking', '', '120 BPM', '从八分音符开始，逐步过渡到十六分音符'],
      [11, '推弦音准练习', 2, '演奏技法', 5, 'https://feishu.cn/doc/bending', '', '80 BPM', '注意音准，推弦要达到目标音高'],
      [12, '揉弦速度控制', 2, '演奏技法', 4, '', '', '90 BPM', '从慢到快，保持揉弦宽度一致'],
      [13, '五个指型串联练习', 3, '乐理', 4, '', '', '100 BPM', '先记熟每个指型的位置，再练习串联'],
      [14, '根音位置推导', 4, '乐理', 6, 'https://feishu.cn/doc/caged-theory', '', '', '理解根音位置与和弦指法的关系'],
      [15, '《Scarified》前奏', 5, '曲目与乐段', 8, 'https://feishu.cn/doc/scarified', '', '160 BPM', '先慢练，注意左右手配合的精准度'],
      [16, '《Canon Rock》主旋律', 5, '曲目与乐段', 5, '', '', '140 BPM', '注重旋律的歌唱性和动态起伏'],
      [17, '三连音切换练习', 6, '机能与节奏感', 3, 'https://feishu.cn/doc/triplet', '', '90 BPM', '先在单弦上练习，再扩展到跨弦'],
      [18, '蜘蛛爬行练习', 7, '机能与节奏感', 4, '', '', '60 BPM', '每天10分钟，提升手指独立性'],
      [19, '效果器链路搭建', 8, '设备知识', 2, 'https://feishu.cn/doc/pedalboard', '', '', '过载→延迟→混响的基本链路，以及loop的接法'],
      [20, 'Guitar Pro 使用技巧', 9, '软件使用', 1, '', '', '', '导入音源、调节播放速度、循环练习段落'],
    ]
    for (const s of subs) insertMaterial.run(...s)

    // ═══ 缴费记录 ═══
    const insertPayment = db.prepare(`
      INSERT INTO payments (studentId, studentName, date, amount, packageLabel, lessonCount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const payments: any[] = [
      [1, '吉他少年小王', '2026/04/04', 2600, '正式课一期', 10, '4月新一期，每周六上午'],
      [3, '陈晓艺', '2026/04/02', 5500, '正式课一期', 20, '续报20节套餐'],
      [5, '赵一鸣', '2026/04/01', 3500, '正式课一期', 10, '一期10节，4月开课'],
      [5, '赵一鸣', '2026/05/05', 6000, '正式课二期', 20, '一期上完续报二期20节'],
    ]

    for (const p of payments) {
      insertPayment.run(...p)
    }

    res.json({ ok: true, message: '已重置为演示数据（8位学生、60+节课程、20项课件）' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/seed/status - 检查是否需要种子数据
router.get('/status', (_req: Request, res: Response) => {
  const count = (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count
  res.json({ isEmpty: count === 0 })
})

export default router
