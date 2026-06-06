import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FolderOpen,
  Music,
} from 'lucide-react'

const menuItems = [
  { path: '/', label: '首页看板', icon: LayoutDashboard },
  { path: '/calendar', label: '上课日历', icon: CalendarDays },
  { path: '/students', label: '学生档案', icon: Users },
  { path: '/materials', label: '课件汇总', icon: FolderOpen },
]

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-[#1E3A5F] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
          <Music className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">吉他教室</h1>
          <p className="text-xs text-blue-200/70">教师管理后台</p>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500/25 text-white'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* 底部用户区 */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold">
            老
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">老师</p>
            <p className="text-xs text-blue-200/50 truncate">admin@jita.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
