import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Database,
  Calendar,
  FileText,
  Download,
  Upload,
  AlertTriangle,
} from 'lucide-react'
import { getAllStudents, getAllLessons, getAllMaterials } from '../api'

const BACKEND = 'http://localhost:3001'

type SyncStatus = 'idle' | 'connecting' | 'syncing' | 'success' | 'error'

export default function SyncPage() {
  const [serverStatus, setServerStatus] = useState<SyncStatus>('idle')
  const [serverMsg, setServerMsg] = useState('')

  const [studentSync, setStudentSync] = useState<SyncStatus>('idle')
  const [studentMsg, setStudentMsg] = useState('')
  const [lessonSync, setLessonSync] = useState<SyncStatus>('idle')
  const [lessonMsg, setLessonMsg] = useState('')

  // 检查后端
  const checkServer = useCallback(async () => {
    setServerStatus('connecting')
    try {
      const res = await fetch(`${BACKEND}/api/health`)
      if (res.ok) {
        setServerStatus('success')
        setServerMsg('飞书桥接服务已连接')
      } else {
        setServerStatus('error')
        setServerMsg('服务返回异常')
      }
    } catch {
      setServerStatus('error')
      setServerMsg('无法连接桥接服务，请执行 npm run dev')
    }
  }, [])

  useEffect(() => {
    checkServer()
  }, [checkServer])

  // ── 推送学生 ──
  const pushStudents = async () => {
    setStudentSync('syncing')
    setStudentMsg('从本地读取学生数据…')
    try {
      const students = await getAllStudents()
      if (students.length === 0) {
        setStudentSync('error')
        setStudentMsg('本地没有学生数据可同步')
        return
      }
      setStudentMsg(`正在推送 ${students.length} 条学生数据到飞书…`)
      const res = await fetch(`${BACKEND}/api/sync/students/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      })
      const result = await res.json()
      if (result.success) {
        setStudentSync('success')
        setStudentMsg(`成功推送 ${result.count} 条学生数据`)
      } else {
        setStudentSync('error')
        setStudentMsg(result.error || '推送失败')
      }
    } catch (err: any) {
      setStudentSync('error')
      setStudentMsg(err.message || '网络错误')
    }
    setTimeout(() => { setStudentSync('idle'); setStudentMsg('') }, 4000)
  }

  // ── 拉取学生 ──
  const pullStudents = async () => {
    setStudentSync('syncing')
    setStudentMsg('从飞书拉取学生数据…')
    try {
      const res = await fetch(`${BACKEND}/api/sync/students/pull`)
      const result = await res.json()
      if (result.success) {
        setStudentSync('success')
        setStudentMsg(`从飞书拉取到 ${result.data?.length || 0} 条学生数据（预览模式）`)
      } else {
        setStudentSync('error')
        setStudentMsg(result.error || '拉取失败')
      }
    } catch (err: any) {
      setStudentSync('error')
      setStudentMsg(err.message || '网络错误')
    }
    setTimeout(() => { setStudentSync('idle'); setStudentMsg('') }, 4000)
  }

  // ── 推送课程 ──
  const pushLessons = async () => {
    setLessonSync('syncing')
    setLessonMsg('从本地读取课程数据…')
    try {
      const lessons = await getAllLessons()
      if (lessons.length === 0) {
        setLessonSync('error')
        setLessonMsg('本地没有课程数据可同步')
        return
      }
      setLessonMsg(`正在推送 ${lessons.length} 条课程数据到飞书…`)
      const res = await fetch(`${BACKEND}/api/sync/lessons/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons }),
      })
      const result = await res.json()
      if (result.success) {
        setLessonSync('success')
        setLessonMsg(`成功推送 ${result.count} 条课程数据`)
      } else {
        setLessonSync('error')
        setLessonMsg(result.error || '推送失败')
      }
    } catch (err: any) {
      setLessonSync('error')
      setLessonMsg(err.message || '网络错误')
    }
    setTimeout(() => { setLessonSync('idle'); setLessonMsg('') }, 4000)
  }

  // ── 推送课件 ──
  const [materialSync, setMaterialSync] = useState<SyncStatus>('idle')
  const [materialMsg, setMaterialMsg] = useState('')

  const pushMaterials = async () => {
    setMaterialSync('syncing')
    setMaterialMsg('从本地读取课件数据…')
    try {
      const materials = await getAllMaterials()
      if (materials.length === 0) {
        setMaterialSync('error')
        setMaterialMsg('本地没有课件数据可同步')
        return
      }
      setMaterialMsg(`正在推送 ${materials.length} 条课件数据到飞书…`)
      const res = await fetch(`${BACKEND}/api/sync/materials/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials }),
      })
      const result = await res.json()
      if (result.success) {
        setMaterialSync('success')
        setMaterialMsg(`成功推送 ${result.count} 条课件数据`)
      } else {
        setMaterialSync('error')
        setMaterialMsg(result.error || '推送失败')
      }
    } catch (err: any) {
      setMaterialSync('error')
      setMaterialMsg(err.message || '网络错误')
    }
    setTimeout(() => { setMaterialSync('idle'); setMaterialMsg('') }, 4000)
  }

  const pullMaterials = async () => {
    setMaterialSync('syncing')
    setMaterialMsg('从飞书拉取课件数据…')
    try {
      const res = await fetch(`${BACKEND}/api/sync/materials/pull`)
      const result = await res.json()
      if (result.success) {
        setMaterialSync('success')
        setMaterialMsg(`从飞书拉取到 ${result.data?.length || 0} 条课件数据（预览模式）`)
      } else {
        setMaterialSync('error')
        setMaterialMsg(result.error || '拉取失败')
      }
    } catch (err: any) {
      setMaterialSync('error')
      setMaterialMsg(err.message || '网络错误')
    }
    setTimeout(() => { setMaterialSync('idle'); setMaterialMsg('') }, 4000)
  }

  // ── 拉取课程 ──
  const pullLessons = async () => {
    setLessonSync('syncing')
    setLessonMsg('从飞书拉取课程数据…')
    try {
      const res = await fetch(`${BACKEND}/api/sync/lessons/pull`)
      const result = await res.json()
      if (result.success) {
        setLessonSync('success')
        setLessonMsg(`从飞书拉取到 ${result.data?.length || 0} 条课程数据（预览模式）`)
      } else {
        setLessonSync('error')
        setLessonMsg(result.error || '拉取失败')
      }
    } catch (err: any) {
      setLessonSync('error')
      setLessonMsg(err.message || '网络错误')
    }
    setTimeout(() => { setLessonSync('idle'); setLessonMsg('') }, 4000)
  }

  const ServerIcon = serverStatus === 'success' ? CheckCircle
    : serverStatus === 'error' ? XCircle
    : serverStatus === 'connecting' ? Loader2
    : RefreshCw

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">飞书同步</h2>
        <p className="mt-1 text-sm text-slate-500">
          将本地数据与飞书多维表格、日历同步
        </p>
      </div>

      {/* 服务状态 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ServerIcon className={`h-5 w-5 ${
              serverStatus === 'success' ? 'text-emerald-500'
                : serverStatus === 'error' ? 'text-red-500'
                : 'text-blue-500 animate-spin'
            }`} />
            <div>
              <p className="text-sm font-medium text-slate-900">飞书桥接服务</p>
              <p className="text-xs text-slate-500">{serverMsg || '等待检测…'}</p>
            </div>
          </div>
          <button
            onClick={checkServer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            重新检测
          </button>
        </div>
      </div>

      {/* 后端未启动 */}
      {serverStatus === 'error' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">后端服务未启动</p>
              <p className="text-sm text-amber-700 mt-1">请在终端执行：</p>
              <code className="block mt-2 rounded bg-amber-100 px-3 py-2 text-sm text-amber-900">
                npm run dev
              </code>
            </div>
          </div>
        </div>
      )}

      {/* 同步卡片 */}
      {serverStatus === 'success' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 学生 */}
          <SyncCard
            icon={<Database className="h-5 w-5 text-blue-500" />}
            title="学生档案"
            subtitle="同步学生基本信息和状态"
            msg={studentMsg}
            status={studentSync}
            onPull={pullStudents}
            onPush={pushStudents}
          />
          {/* 课程 */}
          <SyncCard
            icon={<Calendar className="h-5 w-5 text-emerald-500" />}
            title="上课日历"
            subtitle="同步课程安排和上课记录"
            msg={lessonMsg}
            status={lessonSync}
            onPull={pullLessons}
            onPush={pushLessons}
          />
          {/* 课件 */}
          <SyncCard
            icon={<FileText className="h-5 w-5 text-purple-500" />}
            title="课件汇总"
            subtitle="同步教学内容、难度、课件链接"
            msg={materialMsg}
            status={materialSync}
            onPull={pullMaterials}
            onPush={pushMaterials}
          />
        </div>
      )}
    </div>
  )
}

// ── 同步卡片组件 ──
function SyncCard({
  icon,
  title,
  subtitle,
  msg,
  status,
  onPull,
  onPush,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  msg: string
  status: SyncStatus
  onPull: () => void
  onPush: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      {msg && (
        <div
          className={`flex items-center gap-2 mb-3 text-xs px-3 py-2 rounded ${
            status === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : status === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
          }`}
        >
          {status === 'syncing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {status === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
          {status === 'error' && <XCircle className="h-3.5 w-3.5" />}
          {msg}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onPull}
          disabled={status === 'syncing'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          从飞书拉取
        </button>
        <button
          onClick={onPush}
          disabled={status === 'syncing'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          推送到飞书
        </button>
      </div>
    </div>
  )
}
