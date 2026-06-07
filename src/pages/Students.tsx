import { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAllStudents, addStudent, updateStudent, deleteStudent } from '../db/database'
import { getStudentDisplayName } from '../types'
import type { Student, StudentStatus } from '../types'
import StudentModal from '../components/StudentModal'

// ── 状态分组顺序 ──
const STATUS_ORDER: StudentStatus[] = [
  '正式课多节一付',
  '正式课单节一付',
  '仅上试听课',
  '未上课',
  '0号学生',
]

// ── 状态配色 ──
const STATUS_STYLE: Record<StudentStatus, { bg: string; text: string; dot: string }> = {
  '正式课多节一付':  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  '正式课单节一付':  { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500' },
  '仅上试听课':      { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
  '未上课':           { bg: 'bg-slate-50',    text: 'text-slate-600',   dot: 'bg-slate-400' },
  '0号学生':          { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-500' },
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[] | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)

  // 加载数据
  const load = () => getAllStudents().then(setStudents)

  useEffect(() => {
    load()
  }, [])

  // 搜索 → 按状态分组 → 组内按首节试听课日期正序
  const grouped = useMemo(() => {
    if (!students) return []

    // 搜索过滤
    let list = [...students]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((s) => {
        const display = getStudentDisplayName(s).toLowerCase()
        return (
          display.includes(q) ||
          s.wechatNickname.toLowerCase().includes(q) ||
          s.wechatId.toLowerCase().includes(q) ||
          s.actualStudentName.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
        )
      })
    }

    // 按状态分组
    const map = new Map<StudentStatus, Student[]>()
    for (const s of list) {
      const arr = map.get(s.status) || []
      arr.push(s)
      map.set(s.status, arr)
    }

    // 按 STATUS_ORDER 顺序输出，组内按 firstTrialDate 正序
    return STATUS_ORDER
      .map((status) => {
        const items = map.get(status)
        if (!items || items.length === 0) return null
        items.sort((a, b) => {
          if (!a.firstTrialDate && !b.firstTrialDate) return 0
          if (!a.firstTrialDate) return 1
          if (!b.firstTrialDate) return -1
          return a.firstTrialDate.localeCompare(b.firstTrialDate)
        })
        return { status, items }
      })
      .filter(Boolean) as { status: StudentStatus; items: Student[] }[]
  }, [students, search])

  // 新增
  const handleAdd = async (data: Omit<Student, 'id'>) => {
    await addStudent(data)
    setModalOpen(false)
    load()
  }

  // 编辑
  const handleEdit = async (data: Omit<Student, 'id'>) => {
    if (!editingStudent?.id) return
    await updateStudent(editingStudent.id, data)
    setEditingStudent(null)
    load()
  }

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await deleteStudent(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  // 计算总人数（用于顶部统计）
  const totalCount = grouped.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 顶部 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">学生档案</h2>
          <p className="mt-1 text-sm text-slate-500">
            {students ? `共 ${students.length} 位学生` : '加载中…'}
            {search.trim() && students && totalCount !== students.length && (
              <span className="text-blue-600"> · 筛选出 {totalCount} 位</span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          新增学生
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索学生名称、微信昵称、ID…"
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 加载 */}
      {students === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-400">加载中…</span>
        </div>
      )}

      {/* 空状态 */}
      {students?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="h-16 w-16 mb-4" />
          <p className="text-sm">还没有添加学生</p>
          <button
            onClick={() => {
              setEditingStudent(null)
              setModalOpen(true)
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            添加第一位学生
          </button>
        </div>
      )}

      {/* 按状态分组 */}
      {students && students.length > 0 && grouped.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">
          没有匹配的学生
        </div>
      )}

      {grouped.map(({ status, items }) => {
        const style = STATUS_STYLE[status]
        return (
          <div key={status} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* 分组标题 */}
            <div className={`flex items-center gap-3 border-b border-slate-100 px-5 py-3 ${style.bg}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
              <h3 className={`text-sm font-semibold ${style.text}`}>{status}</h3>
              <span className={`ml-auto text-xs font-medium ${style.text} opacity-70`}>
                {items.length} 人
              </span>
            </div>

            {/* 分组表格 */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-left">
                  <th className="px-5 py-2.5 font-medium text-slate-500">学生名称</th>
                  <th className="px-5 py-2.5 font-medium text-slate-500">进度</th>
                  <th className="px-5 py-2.5 font-medium text-slate-500">文档链接</th>
                  <th className="px-5 py-2.5 font-medium text-slate-500">上课地点</th>
                  <th className="px-5 py-2.5 font-medium text-slate-500">首节试听</th>
                  <th className="px-5 py-2.5 text-right font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((s) => {
                  const displayName = getStudentDisplayName(s)
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <button
                          onClick={() => navigate(`/students/${s.id}`)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                        >
                          {displayName}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{s.progress || '-'}</td>
                      <td className="px-5 py-3">
                        {s.docLink ? (
                          <a
                            href={s.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="text-xs">打开</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{s.location || '-'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {s.firstTrialDate || '-'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingStudent(s)
                              setModalOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* 新增/编辑弹窗 */}
      {modalOpen && (
        <StudentModal
          student={editingStudent}
          onSave={(data) => {
            if (editingStudent) {
              handleEdit(data)
            } else {
              handleAdd(data)
            }
          }}
          onClose={() => {
            setModalOpen(false)
            setEditingStudent(null)
          }}
        />
      )}

      {/* 删除确认 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">确认删除</h4>
            <p className="mt-2 text-sm text-slate-500">
              确定要删除 <span className="font-medium text-slate-900">{getStudentDisplayName(deleteTarget)}</span> 吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
