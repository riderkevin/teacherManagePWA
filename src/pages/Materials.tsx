import { FolderOpen } from 'lucide-react'

export default function Materials() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center space-y-3">
        <FolderOpen className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">课件汇总</h2>
        <p className="text-sm text-slate-400">课件管理页面即将上线</p>
      </div>
    </div>
  )
}
