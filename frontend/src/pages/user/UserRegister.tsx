import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/client'
import { ArrowRight, UserPlus } from 'lucide-react'

export default function UserRegister() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.register(form)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto pt-4 sm:pt-8 px-1 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 mb-3">
          <UserPlus className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">회원가입</h1>
        <p className="text-sm text-surface-400 mt-1">새 계정을 만들어 지원사업에 신청하세요</p>
      </div>

      <div className="card-hover">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">이름</label>
            <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="홍길동" required />
          </div>
          <div>
            <label className="label">이메일</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="6자 이상 입력하세요" required minLength={6} />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-danger-50 border border-danger-500/20 rounded-xl animate-slide-up">
              <div className="w-2 h-2 rounded-full bg-danger-500 flex-shrink-0" />
              <p className="text-sm text-danger-700 font-medium">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3
                       bg-gradient-to-r from-primary-600 to-primary-700
                       hover:from-primary-700 hover:to-primary-800
                       text-white rounded-xl font-bold text-sm
                       shadow-lg shadow-primary-500/25 transition-all duration-300 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>가입하기 <ArrowRight size={15} /></>
            )}
          </button>
        </form>
        <p className="text-sm text-center text-surface-400 mt-5 pt-4 border-t border-surface-100">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}
