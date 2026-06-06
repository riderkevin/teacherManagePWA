// 学生
export interface Student {
  id: string
  name: string
  phone: string
  remainingHours: number
  totalHours: number
  startDate: string
  nextRenewalDate: string
  status: 'active' | 'expiring' | 'expired'
}

// 课程记录
export interface Lesson {
  id: string
  studentId: string
  studentName: string
  date: string
  time: string
  duration: number
  status: 'upcoming' | 'completed' | 'cancelled'
}

// 统计数据
export interface LessonStats {
  thisWeek: number
  thisMonth: number
}
