import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red'
  onClick?: () => void
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', onClick }: StatCardProps) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2 ${c.bg} flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  )
}
