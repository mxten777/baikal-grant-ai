import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { programsApi } from '../../api/client'
import { Plus, Pencil, Trash2, Settings, FolderOpen, Calendar, Banknote, X } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  draft: { label: '초안', color: 'bg-surface-100 text-surface-500', dot: 'bg-surface-400' },
  active: { label: '진행중', color: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  closed: { label: '마감', color: 'bg-danger-50 text-danger-600', dot: 'bg-danger-500' },
}

const EMPTY_FORM = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  apply_start_date: '',
  apply_end_date: '',
  budget_amount: '',
  status: 'active',
}

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const navigate = useNavigate()

  const load = () => programsApi.list().then(r => setPrograms(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      title: p.title || '',
      description: p.description || '',
      start_date: p.start_date?.slice(0, 10) || '',
      end_date: p.end_date?.slice(0, 10) || '',
      apply_start_date: p.apply_start_date?.slice(0, 10) || '',
      apply_end_date: p.apply_end_date?.slice(0, 10) || '',
      budget_amount: p.budget_amount || '',
      status: p.status || 'active',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = { ...form, budget_amount: form.budget_amount ? Number(form.budget_amount) : null }
    if (editing) await programsApi.update(editing.id, payload)
    else await programsApi.create(payload)
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await programsApi.delete(id)
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">지원사업 관리</h2>
          <p className="text-sm text-surface-400 mt-1">사업을 등록하고 신청서 양식을 설정합니다</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700
                     hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm
                     shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300"
          onClick={openCreate}
        >
          <Plus size={16} /> 사업 추가
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="card-hover text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} className="text-surface-300" />
          </div>
          <p className="text-surface-400 font-medium">등록된 사업이 없습니다</p>
          <p className="text-xs text-surface-300 mt-1">첫 번째 지원사업을 등록해보세요</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map(p => {
            const st = STATUS_LABELS[p.status] || { label: p.status, color: 'bg-surface-100 text-surface-500', dot: 'bg-surface-400' }
            return (
              <div key={p.id} className="card-hover group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 truncate">{p.title}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-sm text-surface-500 line-clamp-1 mb-3">{p.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-surface-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary-400" />
                        접수: {p.apply_start_date ? p.apply_start_date.slice(0, 10) : '-'} ~ {p.apply_end_date ? p.apply_end_date.slice(0, 10) : '-'}
                      </span>
                      {p.budget_amount && (
                        <span className="flex items-center gap-1.5">
                          <Banknote size={13} className="text-success-500" />
                          {Number(p.budget_amount).toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-0 sm:ml-4 mt-3 sm:mt-0 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/admin/programs/${p.id}/form`)}
                      className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="폼 빌더"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 text-surface-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Premium Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-lg animate-slide-up border border-surface-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editing ? '사업 수정' : '새 사업 등록'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors">
                <X size={18} className="text-surface-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">사업명 *</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="사업명을 입력하세요" />
              </div>
              <div>
                <label className="label">사업 설명</label>
                <textarea className="input h-24 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="사업에 대한 상세 설명" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">사업 시작일</label>
                  <input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">사업 종료일</label>
                  <input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">접수 시작일</label>
                  <input type="date" className="input" value={form.apply_start_date} onChange={e => setForm({ ...form, apply_start_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">접수 마감일</label>
                  <input type="date" className="input" value={form.apply_end_date} onChange={e => setForm({ ...form, apply_end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">지원금액 (원)</label>
                  <input type="number" className="input" value={form.budget_amount} onChange={e => setForm({ ...form, budget_amount: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="label">상태</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">초안</option>
                    <option value="active">진행중</option>
                    <option value="closed">마감</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50/50 rounded-b-2xl">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
