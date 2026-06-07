import { db } from './database'
import { extractMonth, extractWeek, calcEndTime } from '../types'

// ── 首次启动时写入初始数据 ──
export async function seedIfEmpty() {
  const studentCount = await db.students.count()
  if (studentCount > 0) return

  await db.students.bulkAdd([
    {
      wechatNickname: '吉他少年小王',
      wechatId: 'wxid_wang123',
      isNotSelf: false,
      actualStudentName: '王雨涵',
      progress: '第8课 - CAGED系统',
      docLink: 'https://feishu.cn/doc/example1',
      location: '工作室',
      trialPrice: 0,
      singlePrice: 300,
      tenPackPrice: 2600,
      twentyPackPrice: 4800,
      notes: '喜欢指弹风格，每周六下午',
      firstTrialDate: '2026-01-10',
      status: '正式课多节一付',
      instrumentBackground: '自学过半年木吉他',
      musicPreference: '指弹、日系摇滚',
    },
    {
      wechatNickname: '音乐老张',
      wechatId: 'wxid_zhang456',
      isNotSelf: true,
      actualStudentName: '张小明',
      progress: '第5课 - 五声音阶',
      docLink: '',
      location: '线上',
      trialPrice: 50,
      singlePrice: 250,
      tenPackPrice: 2200,
      twentyPackPrice: 4000,
      notes: '基础不错，已学完基础和弦',
      firstTrialDate: '2026-03-01',
      status: '正式课单节一付',
      instrumentBackground: '零基础',
      musicPreference: '布鲁斯、硬摇滚',
    },
    {
      wechatNickname: 'Lisa妈妈',
      wechatId: 'lisamom789',
      isNotSelf: true,
      actualStudentName: '陈晓艺',
      progress: '第12课 - 速弹基础',
      docLink: 'https://feishu.cn/doc/example2',
      location: '工作室',
      trialPrice: 0,
      singlePrice: 350,
      tenPackPrice: 3000,
      twentyPackPrice: 5500,
      notes: '妈妈负责沟通，课程由爸爸接送',
      firstTrialDate: '2025-09-01',
      status: '正式课多节一付',
      instrumentBackground: '学过2年钢琴',
      musicPreference: '流行、Funk',
    },
    {
      wechatNickname: '阿远🎸',
      wechatId: 'yuanyuan_guitar',
      isNotSelf: false,
      actualStudentName: '李思远',
      progress: '第2课 - 基础节奏',
      docLink: '',
      location: '学生家',
      trialPrice: 80,
      singlePrice: 280,
      tenPackPrice: 0,
      twentyPackPrice: 0,
      notes: '刚报的试听课，有意向报正式课',
      firstTrialDate: '2026-05-20',
      status: '仅上试听课',
      instrumentBackground: '零基础',
      musicPreference: '民谣弹唱',
    },
  ])

  // ── 演示课程数据 ──
  const makeLesson = (
    studentId: number,
    studentName: string,
    startTime: string,
    duration: number,
    status: '未上课' | '已上课' | '放鸽子',
  ) => ({
    title: `吉他课-${studentName}`,
    studentId,
    studentName,
    startTime,
    endTime: calcEndTime(startTime, duration),
    duration,
    status,
    month: extractMonth(startTime),
    week: extractWeek(startTime),
  })

  await db.lessons.bulkAdd([
    // 6月6日（今天）
    makeLesson(1, '吉他少年小王', '2026/06/06 10:00', 1, '未上课'),
    makeLesson(2, '张小明',       '2026/06/06 14:00', 2, '未上课'),
    makeLesson(3, '陈晓艺',       '2026/06/06 16:30', 1, '未上课'),
    // 6月7日
    makeLesson(4, '阿远🎸',       '2026/06/07 09:00', 1, '未上课'),
    makeLesson(1, '吉他少年小王', '2026/06/07 11:00', 1, '未上课'),
    // 6月8日
    makeLesson(2, '张小明',       '2026/06/08 15:00', 1, '未上课'),
    makeLesson(3, '陈晓艺',       '2026/06/08 18:00', 2, '未上课'),
    // 已上完的历史课程
    makeLesson(1, '吉他少年小王', '2026/06/05 10:00', 1, '已上课'),
    makeLesson(2, '张小明',       '2026/06/04 14:00', 2, '已上课'),
    makeLesson(3, '陈晓艺',       '2026/06/04 16:00', 1, '已上课'),
    makeLesson(1, '吉他少年小王', '2026/06/03 18:00', 2, '已上课'),
    makeLesson(2, '张小明',       '2026/06/02 10:00', 1, '已上课'),
    makeLesson(3, '陈晓艺',       '2026/06/01 11:00', 1, '已上课'),
    makeLesson(2, '张小明',       '2026/06/03 09:00', 1, '已上课'),
    makeLesson(3, '陈晓艺',       '2026/06/02 15:00', 1, '放鸽子'),
  ])

  // ── 演示课件数据 ──
  // 使用显式 ID 建立父子层级关系
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

  console.log('✅ 演示数据已写入本地数据库')
}
