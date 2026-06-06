import { Users } from 'lucide-react'

export default function Students() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center space-y-3">
        <Users className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">学生档案</h2>
        <p className="text-sm text-slate-400">学生管理与档案页面即将上线</p>
      </div>
    </div>
  )
}
