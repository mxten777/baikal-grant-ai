import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, FolderOpen, FileText, LogOut, Shield, ChevronRight, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: '대시보드', icon: LayoutDashboard, desc: '현황 요약' },
  { to: '/admin/programs', label: '지원사업 관리', icon: FolderOpen, desc: '사업 등록/수정' },
  { to: '/admin/applications', label: '신청 현황', icon: FileText, desc: '접수 및 심사' },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-6 py-5 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">BAIKAL Grant AI</h1>
            <p className="text-[11px] text-surface-400 font-medium">Management Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold text-surface-400 uppercase tracking-wider">메뉴</p>
        {navItems.map(({ to, label, icon: Icon, desc }) => {
          const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-500/5'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-gray-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                active
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'bg-surface-100 text-surface-400 group-hover:bg-surface-200 group-hover:text-surface-600'
              }`}>
                <Icon size={17} />
              </div>
              <div className="flex-1">
                <span className="block">{label}</span>
                <span className={`block text-[11px] font-normal ${active ? 'text-primary-500' : 'text-surface-400'}`}>{desc}</span>
              </div>
              {active && (
                <div className="w-1.5 h-8 rounded-full bg-primary-600 -mr-1" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4">
        <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/20">
              {user?.full_name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.full_name || '관리자'}</p>
              <p className="text-[11px] text-surface-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors"
          >
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-surface-200/60 h-14 flex items-center px-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 rounded-lg hover:bg-surface-100 transition-colors">
          <Menu size={20} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2.5 ml-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-sm font-extrabold text-gray-900 tracking-tight">BAIKAL Grant AI</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-xl animate-slide-in-right">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-100 z-10 transition-colors"
            >
              <X size={18} className="text-surface-400" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-surface-200/80 flex-col shadow-sm">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-surface-50/50 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
