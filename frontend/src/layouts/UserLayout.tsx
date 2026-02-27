import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { User, LogOut, LogIn, ClipboardList, Shield, ChevronRight, Menu, X } from 'lucide-react'

export default function UserLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20">
              <Shield size={14} className="text-white sm:hidden" />
              <Shield size={16} className="text-white hidden sm:block" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight group-hover:text-primary-700 transition-colors">
              BAIKAL Grant AI
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-surface-500 hover:bg-surface-50 hover:text-gray-700'
              }`}
            >
              지원사업
            </Link>
            {user ? (
              <>
                <Link
                  to="/my-applications"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    pathname === '/my-applications' ? 'bg-primary-50 text-primary-700' : 'text-surface-500 hover:bg-surface-50 hover:text-gray-700'
                  }`}
                >
                  <ClipboardList size={15} /> 신청내역
                </Link>
                <div className="w-px h-5 bg-surface-200 mx-2" />
                <span className="text-sm font-semibold text-gray-700 px-2">{user.full_name}</span>
                <button
                  onClick={() => { logout(); navigate('/') }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-surface-500 hover:bg-surface-50 hover:text-gray-700 rounded-lg transition-colors">
                  <LogIn size={15} /> 로그인
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/20 hover:shadow-lg transition-all"
                >
                  회원가입 <ChevronRight size={14} />
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-1 rounded-lg hover:bg-surface-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-200/50 bg-white/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                지원사업
              </Link>
              {user ? (
                <>
                  <Link
                    to="/my-applications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      pathname === '/my-applications' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-surface-50'
                    }`}
                  >
                    <ClipboardList size={15} /> 신청내역
                  </Link>
                  <div className="border-t border-surface-100 my-2" />
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-semibold text-gray-700">{user.full_name}</span>
                    <button
                      onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <LogOut size={14} /> 로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-surface-50 transition-colors"
                  >
                    <LogIn size={15} /> 로그인
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 mx-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                  >
                    회원가입 <ChevronRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      {/* Footer */}
      <footer className="border-t border-surface-100 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-surface-400">&copy; 2026 BAIKAL Grant AI. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
            <span className="text-xs font-bold text-surface-400 hidden sm:inline">BAIKAL</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
