import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/client'
import { Shield, ArrowRight, Sparkles } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@baikal.ai')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      setAuth({ id: 0, email, full_name: '', role: '' }, res.data.access_token)
      const me = await authApi.me()
      if (me.data.role !== 'admin') {
        setError('관리자 계정이 아닙니다.')
        logout()
        return
      }
      setAuth(me.data, res.data.access_token)
      navigate('/admin')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '0.5s' }} />
      </div>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo area */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-4 shadow-elevated">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">BAIKAL Grant AI</h1>
          <p className="text-primary-200 mt-2 text-sm font-medium flex items-center justify-center gap-1.5">
            <Sparkles size={14} /> 보조금 지원사업 관리 시스템
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-elevated p-6 sm:p-8 border border-white/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">관리자 로그인</h2>
            <p className="text-sm text-surface-500 mt-1">관리 포털에 접속합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">이메일</label>
              <input
                type="email"
                className="input !py-3 !px-4 !bg-surface-50/80"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@baikal.ai"
                required
              />
            </div>
            <div>
              <label className="label">비밀번호</label>
              <input
                type="password"
                className="input !py-3 !px-4 !bg-surface-50/80"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-danger-50 border border-danger-500/20 rounded-xl animate-slide-up">
                <div className="w-2 h-2 rounded-full bg-danger-500 flex-shrink-0" />
                <p className="text-sm text-danger-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5
                         bg-gradient-to-r from-primary-600 to-primary-700
                         hover:from-primary-700 hover:to-primary-800
                         text-white rounded-xl font-bold text-sm
                         shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30
                         transition-all duration-300 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>로그인 <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-300/60 text-xs mt-6">
          &copy; 2026 BAIKAL Grant AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}
