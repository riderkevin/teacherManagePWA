import { db } from './database'
import { extractMonth, extractWeek, calcEndTime } from '../types'

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

// ── 为一周生成一次课的辅助函数 ──
function weeklyLessons(
  studentId: number,
  studentName: string,
  weekday: number,        // 0=Sun … 6=Sat
  time: string,           // 'HH:MM'
  duration: number,       // 小时
  lessonType: string,     // 课程类型
  income: number,         // 已完成课程收入（仅试听课/正式课单节有效）
  packageLabel: string,   // 多节时套餐标签
  from: Date,             // 范围起点
  to: Date,               // 范围终点
  overrides?: Record<string, Partial<{ status: string; income: number; duration: number }>>,
) {
  const today = new Date(2026, 5, 7) // 2026-06-07
  today.setHours(0, 0, 0, 0)

  const [h, m] = time.split(':').map(Number)
  const cursor = new Date(from)
  // 找到第一个匹配的 weekday
  while (cursor.getDay() !== weekday) {
    cursor.setDate(cursor.getDate() + 1)
  }

  // 跟踪累计课时编号（只计非试听课的已上课）
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

    // 课时编号（仅正式课计入）
    const isFormal = lessonType !== '试听课' && s !== '放鸽子'
    const typeLabel = lessonType === '试听课' ? '试听课' : '正式课'
    let 课时Suffix = ''
    if (isFormal) {
      if (d === 1) {
        课时Suffix = `课时${lessonNum + 1}`
      } else {
        const nums: number[] = []
        for (let i = 0; i < d; i++) nums.push(lessonNum + i + 1)
        课时Suffix = `课时${nums.join('、')}`
      }
      lessonNum += d
    }

    lessons.push({
      title: 课时Suffix ? `${studentName}-${typeLabel}-${课时Suffix}` : `${studentName}-${typeLabel}`,
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

// ── 实际写入种子数据 ──
async function seedData() {
  // ═══ 学生（显式 ID，确保和课程引用一致） ═══
  await db.students.bulkAdd([
    {
      id: 1,
      wechatNickname: '吉他少年小王',
      wechatId: 'wxid_wang123',
      isNotSelf: false,
      actualStudentName: '王雨涵',
      docLink: 'https://feishu.cn/doc/example1',
      location: '工作室',
      trialPrice: 0,
      singlePrice: 300,
      tenPackPrice: 2600,
      twentyPackPrice: 4800,
      notes: '喜欢指弹风格，每周六上午',
      firstTrialDate: '2026/01/10',
      status: '正式课多节一付',
      instrumentBackground: '自学过半年木吉他',
      musicPreference: '指弹、日系摇滚',
    },
    {
      id: 2,
      wechatNickname: '音乐老张',
      wechatId: 'wxid_zhang456',
      isNotSelf: true,
      actualStudentName: '张小明',
      docLink: '',
      location: '线上',
      trialPrice: 50,
      singlePrice: 250,
      tenPackPrice: 2200,
      twentyPackPrice: 4000,
      notes: '基础不错，已学完基础和弦，每周三下午线上课',
      firstTrialDate: '2026/03/01',
      status: '正式课单节一付',
      instrumentBackground: '零基础',
      musicPreference: '布鲁斯、硬摇滚',
    },
    {
      id: 3,
      wechatNickname: 'Lisa妈妈',
      wechatId: 'lisamom789',
      isNotSelf: true,
      actualStudentName: '陈晓艺',
      docLink: 'https://feishu.cn/doc/example2',
      location: '工作室',
      trialPrice: 0,
      singlePrice: 350,
      tenPackPrice: 3000,
      twentyPackPrice: 5500,
      notes: '妈妈负责沟通，课程由爸爸接送',
      firstTrialDate: '2025/09/01',
      status: '正式课多节一付',
      instrumentBackground: '学过2年钢琴',
      musicPreference: '流行、Funk',
    },
    {
      id: 4,
      wechatNickname: '阿远🎸',
      wechatId: 'yuanyuan_guitar',
      isNotSelf: false,
      actualStudentName: '李思远',
      docLink: '',
      location: '学生家',
      trialPrice: 80,
      singlePrice: 280,
      tenPackPrice: 0,
      twentyPackPrice: 0,
      notes: '刚报的试听课，有意向报正式课',
      firstTrialDate: '2026/05/20',
      status: '仅上试听课',
      instrumentBackground: '零基础',
      musicPreference: '民谣弹唱',
    },
    // ── 新增学生 ──
    {
      id: 5,
      wechatNickname: '摇滚老赵',
      wechatId: 'zhaoyiming_rock',
      isNotSelf: false,
      actualStudentName: '赵一鸣',
      docLink: 'https://feishu.cn/doc/zhao',
      location: '工作室',
      trialPrice: 0,
      singlePrice: 400,
      tenPackPrice: 3500,
      twentyPackPrice: 6000,
      notes: '学得很快，已能弹《Scarified》前半段，每周二傍晚',
      firstTrialDate: '2025/11/15',
      status: '正式课多节一付',
      instrumentBackground: '自学电吉他2年',
      musicPreference: '重金属、新古典',
    },
    {
      id: 6,
      wechatNickname: '雨桐妈妈',
      wechatId: 'yutong_mom',
      isNotSelf: true,
      actualStudentName: '刘雨桐',
      docLink: '',
      location: '工作室',
      trialPrice: 50,
      singlePrice: 280,
      tenPackPrice: 2400,
      twentyPackPrice: 0,
      notes: '初中生，周五放学后来上课，有点内向但很认真',
      firstTrialDate: '2026/04/10',
      status: '正式课单节一付',
      instrumentBackground: '学过1年尤克里里',
      musicPreference: 'J-POP、动漫歌曲',
    },
    {
      id: 7,
      wechatNickname: '舟舟',
      wechatId: 'sunxiaozhou',
      isNotSelf: false,
      actualStudentName: '孙小舟',
      docLink: '',
      location: '工作室',
      trialPrice: 80,
      singlePrice: 260,
      tenPackPrice: 0,
      twentyPackPrice: 0,
      notes: '朋友介绍来的，上周刚试听完，在考虑是否报正式课',
      firstTrialDate: '2026/05/28',
      status: '仅上试听课',
      instrumentBackground: '零基础',
      musicPreference: '说唱、Hip-Hop',
    },
    {
      id: 8,
      wechatNickname: '大鹏哥',
      wechatId: 'dapeng_666',
      isNotSelf: false,
      actualStudentName: '周大鹏',
      docLink: '',
      location: '线上',
      trialPrice: 0,
      singlePrice: 300,
      tenPackPrice: 0,
      twentyPackPrice: 0,
      notes: '工作太忙，3月后暂停上课，说忙完这阵再回来',
      firstTrialDate: '2025/08/20',
      status: '0号学生',
      instrumentBackground: '弹过几年民谣吉他',
      musicPreference: '经典摇滚、民谣',
    },
  ])

  // ═══ 课程数据（近3个月：2026年4月 ~ 6月，按学生每周规律排课） ═══
  const RANGE_START = dt(2026, 4, 1)
  const RANGE_END = dt(2026, 6, 23) // 往后多排两周

  const allLessons: any[] = []

  // 1. 吉他少年小王 — 正式课多节一期10节，每周六 10:00，1h，¥300/节（但多节不计入课程收入）
  // 5/3 放鸽子，6/14 改成2h
  allLessons.push(...weeklyLessons(1, '吉他少年小王', 6, '10:00', 1, '正式课多节', 300, '正式课一期-10节一付', RANGE_START, RANGE_END, {
    '2026/05/03': { status: '放鸽子', income: 0 },
    '2026/06/14': { duration: 2 },
  }))

  // 2. 张小明 — 正式课单节，每周三 14:00，2h，¥250
  // 4/16 请假放鸽子
  allLessons.push(...weeklyLessons(2, '张小明', 3, '14:00', 2, '正式课单节', 500, '', RANGE_START, RANGE_END, {
    '2026/04/16': { status: '放鸽子', income: 0 },
  }))

  // 3. 陈晓艺 — 正式课多节一期20节，每周四 16:00，1h，¥350/节
  // 5/15 放鸽子，6/5 加时到2h
  allLessons.push(...weeklyLessons(3, '陈晓艺', 4, '16:00', 1, '正式课多节', 350, '正式课一期-20节一付', RANGE_START, RANGE_END, {
    '2026/05/15': { status: '放鸽子', income: 0 },
    '2026/06/05': { duration: 2 },
  }))

  // 4. 阿远🎸 — 试听课学生，只有3次课，¥80/节
  allLessons.push(
    ...weeklyLessons(4, '阿远🎸', 2, '15:00', 1, '试听课', 80, '', dt(2026, 5, 20), dt(2026, 6, 10)),
  )

  // 5. 赵一鸣 — 正式课多节，先一期10节再二期20节，每周二 18:00，2h
  // 4/29 请假
  allLessons.push(...weeklyLessons(5, '赵一鸣', 2, '18:00', 2, '正式课多节', 400, '正式课二期-20节一付', RANGE_START, RANGE_END, {
    '2026/04/29': { status: '放鸽子', income: 0 },
  }))
  // 赵一鸣的4月课程属于一期（10节），手动改前几节的 packageLabel
  const zymLessons = allLessons.filter((l: any) => l.studentId === 5 && l.startTime.startsWith('2026/04'))
  zymLessons.forEach((l: any) => { l.packageLabel = '正式课一期-10节一付' })

  // 6. 刘雨桐 — 正式课单节，每周五 15:00，1h，¥280
  // 5/9 请假
  allLessons.push(...weeklyLessons(6, '刘雨桐', 5, '15:00', 1, '正式课单节', 280, '', dt(2026, 4, 11), RANGE_END, {
    '2026/05/09': { status: '放鸽子', income: 0 },
  }))

  // 7. 孙小舟 — 试听课学生，2次课，¥80/节
  allLessons.push(
    ...weeklyLessons(7, '孙小舟', 4, '11:00', 1, '试听课', 80, '', dt(2026, 5, 28), dt(2026, 6, 10)),
  )

  // 8. 周大鹏 — 0号学生，只有4月的2次历史课（已停课）
  allLessons.push(
    {
      title: '周大鹏-正式课-课时1', studentId: 8, studentName: '周大鹏',
      startTime: '2026/04/01 19:00', endTime: '2026/04/01 20:00',
      duration: 1, status: '已上课', month: '2026年4月', week: '2026年4月第1周',
      income: 300, lessonType: '正式课单节', packageLabel: '',
    },
    {
      title: '周大鹏-正式课-课时2', studentId: 8, studentName: '周大鹏',
      startTime: '2026/04/08 19:00', endTime: '2026/04/08 20:00',
      duration: 1, status: '已上课', month: '2026年4月', week: '2026年4月第2周',
      income: 300, lessonType: '正式课单节', packageLabel: '',
    },
  )

  // 去重排序后写入
  const sorted = allLessons.sort((a, b) => a.startTime.localeCompare(b.startTime))
  await db.lessons.bulkAdd(sorted)

  // ═══ 课件数据 ═══
  await db.materials.bulkAdd([
    // ── 演奏技法 ──
    { id: 1,  content: '交替拨弦',        parentId: null, category: '演奏技法', difficulty: 3, fileLink: '', fileName: '', targetSpeed: '', notes: '经济拨弦、交替拨弦的基础与进阶' },
    { id: 2,  content: '推弦与揉弦',      parentId: null, category: '演奏技法', difficulty: 5, fileLink: '', fileName: '', targetSpeed: '', notes: '左手技巧的核心内容' },
    { id: 10, content: '经济拨弦练习',    parentId: 1,    category: '演奏技法', difficulty: 3, fileLink: 'https://feishu.cn/doc/alt-picking', fileName: '', targetSpeed: '120 BPM', notes: '从八分音符开始，逐步过渡到十六分音符' },
    { id: 11, content: '推弦音准练习',    parentId: 2,    category: '演奏技法', difficulty: 5, fileLink: 'https://feishu.cn/doc/bending', fileName: '', targetSpeed: '80 BPM', notes: '注意音准，推弦要达到目标音高' },
    { id: 12, content: '揉弦速度控制',    parentId: 2,    category: '演奏技法', difficulty: 4, fileLink: '', fileName: '', targetSpeed: '90 BPM', notes: '从慢到快，保持揉弦宽度一致' },

    // ── 乐理 ──
    { id: 3,  content: '五声音阶',        parentId: null, category: '乐理', difficulty: 4, fileLink: '', fileName: '', targetSpeed: '', notes: '五个指型的位置记忆与串联' },
    { id: 4,  content: 'CAGED系统和弦',   parentId: null, category: '乐理', difficulty: 6, fileLink: '', fileName: '', targetSpeed: '', notes: '理解和弦推导体系' },
    { id: 13, content: '五个指型串联练习', parentId: 3,    category: '乐理', difficulty: 4, fileLink: '', fileName: '', targetSpeed: '100 BPM', notes: '先记熟每个指型的位置，再练习串联' },
    { id: 14, content: '根音位置推导',    parentId: 4,    category: '乐理', difficulty: 6, fileLink: 'https://feishu.cn/doc/caged-theory', fileName: '', targetSpeed: '', notes: '理解根音位置与和弦指法的关系' },

    // ── 曲目与乐段 ──
    { id: 5,  content: '练习曲目',        parentId: null, category: '曲目与乐段', difficulty: 0, fileLink: '', fileName: '', targetSpeed: '', notes: '经典曲目分段练习' },
    { id: 15, content: '《Scarified》前奏', parentId: 5,   category: '曲目与乐段', difficulty: 8, fileLink: 'https://feishu.cn/doc/scarified', fileName: '', targetSpeed: '160 BPM', notes: '先慢练，注意左右手配合的精准度' },
    { id: 16, content: '《Canon Rock》主旋律', parentId: 5, category: '曲目与乐段', difficulty: 5, fileLink: '', fileName: '', targetSpeed: '140 BPM', notes: '注重旋律的歌唱性和动态起伏' },

    // ── 机能与节奏感 ──
    { id: 6,  content: '节奏训练',        parentId: null, category: '机能与节奏感', difficulty: 3, fileLink: '', fileName: '', targetSpeed: '', notes: '节拍器跟练系列' },
    { id: 7,  content: '手指机能',        parentId: null, category: '机能与节奏感', difficulty: 4, fileLink: '', fileName: '', targetSpeed: '', notes: '独立性、伸展性训练' },
    { id: 17, content: '三连音切换练习',  parentId: 6,    category: '机能与节奏感', difficulty: 3, fileLink: 'https://feishu.cn/doc/triplet', fileName: '', targetSpeed: '90 BPM', notes: '先在单弦上练习，再扩展到跨弦' },
    { id: 18, content: '蜘蛛爬行练习',    parentId: 7,    category: '机能与节奏感', difficulty: 4, fileLink: '', fileName: '', targetSpeed: '60 BPM', notes: '每天10分钟，提升手指独立性' },

    // ── 设备知识 ──
    { id: 8,  content: '效果器',          parentId: null, category: '设备知识', difficulty: 2, fileLink: '', fileName: '', targetSpeed: '', notes: '效果器选择与使用' },
    { id: 19, content: '效果器链路搭建',  parentId: 8,    category: '设备知识', difficulty: 2, fileLink: 'https://feishu.cn/doc/pedalboard', fileName: '', targetSpeed: '', notes: '过载→延迟→混响的基本链路，以及loop的接法' },

    // ── 软件使用 ──
    { id: 9,  content: '软件工具',        parentId: null, category: '软件使用', difficulty: 1, fileLink: '', fileName: '', targetSpeed: '', notes: '常用音乐软件教程' },
    { id: 20, content: 'Guitar Pro 使用技巧', parentId: 9, category: '软件使用', difficulty: 1, fileLink: '', fileName: '', targetSpeed: '', notes: '导入音源、调节播放速度、循环练习段落' },
  ])

  // ═══ 缴费记录（正式课多节学生的周期缴费） ═══
  await db.payments.bulkAdd([
    {
      studentId: 1, studentName: '吉他少年小王',
      date: '2026/04/04', amount: 2600, packageLabel: '正式课一期', lessonCount: 10,
      notes: '4月新一期，每周六上午',
    },
    {
      studentId: 3, studentName: '陈晓艺',
      date: '2026/04/02', amount: 5500, packageLabel: '正式课一期', lessonCount: 20,
      notes: '续报20节套餐',
    },
    {
      studentId: 5, studentName: '赵一鸣',
      date: '2026/04/01', amount: 3500, packageLabel: '正式课一期', lessonCount: 10,
      notes: '一期10节，4月开课',
    },
    {
      studentId: 5, studentName: '赵一鸣',
      date: '2026/05/05', amount: 6000, packageLabel: '正式课二期', lessonCount: 20,
      notes: '一期上完续报二期20节',
    },
  ])

  console.log('✅ 演示数据已写入本地数据库')
}

// ── 首次启动时写入 ──
export async function seedIfEmpty() {
  const studentCount = await db.students.count()
  if (studentCount > 0) return
  await seedData()
}

// ── 强制重置为演示数据 ──
export async function resetToSeedData() {
  await db.students.clear()
  await db.lessons.clear()
  await db.materials.clear()
  await db.payments.clear()
  await db.lessonMaterials.clear()
  await seedData()
}
