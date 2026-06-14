// ── 统一导出 —— 保持与旧 src/db/database.ts 相同的导出接口 ──
// 页面组件只需将 import from '../db/database' 改为 import from '../api'

export {
  getAllStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  deleteStudentCascade,
  getLessonsByStudentId,
  getPaymentsByStudentId,
  getStudentPackageStats,
  getStudentWxLogs,
} from './students'

export {
  getAllLessons,
  getUpcomingLessons,
  getLessonMonths,
  getLessonsByMonth,
  addLesson,
  updateLesson,
  deleteLesson,
} from './lessons'

export {
  getAllMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
} from './materials'

export {
  addPayment,
  updatePayment,
  deletePayment,
} from './payments'

export {
  getLessonMaterials,
  addLessonMaterial,
  deleteLessonMaterial,
} from './lessonMaterials'

export {
  getThisWeekStats,
  getThisMonthStats,
  getThisWeekIncome,
  getThisMonthIncome,
  getDashboardSummary,
  exportAllData,
  importAllData,
} from './stats'
export type { DashboardSummary } from './stats'

export {
  checkFirstTime,
  setupPassword,
  login,
  verifyToken,
  logout,
} from './auth'

export { setAuthToken, getAuthToken } from './client'

export {
  getAllBandEvents,
  addBandEvent,
  updateBandEvent,
  deleteBandEvent,
  getAllBandSongs,
  addBandSong,
  updateBandSong,
  deleteBandSong,
  getBandEventSongs,
  setBandEventSongs,
} from './band'

export {
  getAllCloudFiles,
  addCloudFile,
  updateCloudFile,
  deleteCloudFile,
} from './cloudFiles'
