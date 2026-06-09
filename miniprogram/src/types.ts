// 共享类型定义 —— 从后台 src/types/index.ts 复制核心类型
// 小程序端不需要全部字段，只取需要的

export interface Student {
  id?: number
  wechatNickname: string
  isNotSelf: boolean
  actualStudentName: string
  status: string
  location: string
  notes: string
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
  lessonType: string
  month: string
  week: string
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
