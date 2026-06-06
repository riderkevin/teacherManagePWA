import type { Student, Lesson } from '../types'

// ========== 学生数据 ==========
export const students: Student[] = [
  {
    id: '1',
    name: '张小明',
    phone: '13800001111',
    remainingHours: 8,
    totalHours: 24,
    startDate: '2026-03-01',
    nextRenewalDate: '2026-06-20',
    status: 'active',
  },
  {
    id: '2',
    name: '李思远',
    phone: '13800002222',
    remainingHours: 2,
    totalHours: 12,
    startDate: '2026-04-15',
    nextRenewalDate: '2026-06-08',
    status: 'expiring',
  },
  {
    id: '3',
    name: '王雨涵',
    phone: '13800003333',
    remainingHours: 15,
    totalHours: 24,
    startDate: '2026-01-10',
    nextRenewalDate: '2026-07-15',
    status: 'active',
  },
  {
    id: '4',
    name: '赵一鸣',
    phone: '13800004444',
    remainingHours: 1,
    totalHours: 12,
    startDate: '2026-05-01',
    nextRenewalDate: '2026-06-10',
    status: 'expiring',
  },
  {
    id: '5',
    name: '陈晓艺',
    phone: '13800005555',
    remainingHours: 20,
    totalHours: 48,
    startDate: '2025-09-01',
    nextRenewalDate: '2026-08-01',
    status: 'active',
  },
  {
    id: '6',
    name: '刘浩然',
    phone: '13800006666',
    remainingHours: 5,
    totalHours: 12,
    startDate: '2026-02-20',
    nextRenewalDate: '2026-06-05',
    status: 'expiring',
  },
  {
    id: '7',
    name: '周子萱',
    phone: '13800007777',
    remainingHours: 0,
    totalHours: 12,
    startDate: '2026-02-01',
    nextRenewalDate: '2026-05-30',
    status: 'expired',
  },
  {
    id: '8',
    name: '林宇恒',
    phone: '13800008888',
    remainingHours: 18,
    totalHours: 24,
    startDate: '2026-03-15',
    nextRenewalDate: '2026-07-01',
    status: 'active',
  },
]

// ========== 课程数据 ==========
export const lessons: Lesson[] = [
  // 今天 (6/6 周六)
  {
    id: '1',
    studentId: '1',
    studentName: '张小明',
    date: '2026-06-06',
    time: '10:00',
    duration: 1,
    status: 'upcoming',
  },
  {
    id: '2',
    studentId: '3',
    studentName: '王雨涵',
    date: '2026-06-06',
    time: '14:00',
    duration: 2,
    status: 'upcoming',
  },
  {
    id: '3',
    studentId: '5',
    studentName: '陈晓艺',
    date: '2026-06-06',
    time: '16:30',
    duration: 1,
    status: 'upcoming',
  },
  // 明天 (6/7 周日)
  {
    id: '4',
    studentId: '2',
    studentName: '李思远',
    date: '2026-06-07',
    time: '09:00',
    duration: 1,
    status: 'upcoming',
  },
  {
    id: '5',
    studentId: '6',
    studentName: '刘浩然',
    date: '2026-06-07',
    time: '11:00',
    duration: 1,
    status: 'upcoming',
  },
  // 后天 (6/8 周一)
  {
    id: '6',
    studentId: '4',
    studentName: '赵一鸣',
    date: '2026-06-08',
    time: '15:00',
    duration: 1,
    status: 'upcoming',
  },
  {
    id: '7',
    studentId: '8',
    studentName: '林宇恒',
    date: '2026-06-08',
    time: '18:00',
    duration: 2,
    status: 'upcoming',
  },
  // 本周已完成的课程（用于统计）
  {
    id: '8',
    studentId: '1',
    studentName: '张小明',
    date: '2026-06-05',
    time: '10:00',
    duration: 1,
    status: 'completed',
  },
  {
    id: '9',
    studentId: '3',
    studentName: '王雨涵',
    date: '2026-06-04',
    time: '14:00',
    duration: 2,
    status: 'completed',
  },
  {
    id: '10',
    studentId: '6',
    studentName: '刘浩然',
    date: '2026-06-04',
    time: '16:00',
    duration: 1,
    status: 'completed',
  },
  {
    id: '11',
    studentId: '8',
    studentName: '林宇恒',
    date: '2026-06-03',
    time: '18:00',
    duration: 2,
    status: 'completed',
  },
  {
    id: '12',
    studentId: '5',
    studentName: '陈晓艺',
    date: '2026-06-02',
    time: '10:00',
    duration: 1,
    status: 'completed',
  },
  {
    id: '13',
    studentId: '2',
    studentName: '李思远',
    date: '2026-06-01',
    time: '11:00',
    duration: 1,
    status: 'completed',
  },
  // 本月已完成的课程（6月份，继续添加）
  {
    id: '14',
    studentId: '2',
    studentName: '李思远',
    date: '2026-06-03',
    time: '09:00',
    duration: 1,
    status: 'completed',
  },
  {
    id: '15',
    studentId: '4',
    studentName: '赵一鸣',
    date: '2026-06-02',
    time: '15:00',
    duration: 1,
    status: 'completed',
  },
]

// ========== 辅助函数 ==========

/** 获取最近 n 天的课程 */
export function getUpcomingLessons(days: number = 3): Lesson[] {
  const today = new Date('2026-06-06')
  const end = new Date(today)
  end.setDate(end.getDate() + days - 1)

  return lessons
    .filter((l) => {
      const d = new Date(l.date)
      return d >= today && d <= end && l.status === 'upcoming'
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}

/** 获取即将续费的学生（剩余课时 <= 3 或已过期） */
export function getRenewalStudents(): Student[] {
  return students
    .filter((s) => s.remainingHours <= 3 || s.status === 'expired')
    .sort((a, b) => a.remainingHours - b.remainingHours)
}

/** 获取本周课时统计（已完成） */
export function getThisWeekStats(): number {
  const today = new Date('2026-06-06')
  const dayOfWeek = today.getDay() // 0=周日, 6=周六
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)) // 本周一

  return lessons
    .filter((l) => {
      const d = new Date(l.date)
      return d >= monday && d <= today && l.status === 'completed'
    })
    .reduce((sum, l) => sum + l.duration, 0)
}

/** 获取本月课时统计（已完成） */
export function getThisMonthStats(): number {
  return lessons
    .filter((l) => {
      const d = new Date(l.date)
      return d.getMonth() === 5 && d.getFullYear() === 2026 && l.status === 'completed'
    })
    .reduce((sum, l) => sum + l.duration, 0)
}
