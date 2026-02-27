import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formsApi, programsApi } from '../../api/client'
import { Plus, Trash2, GripVertical, ChevronLeft, Save, Type, Hash, ListFilter, CheckSquare, CalendarDays, Paperclip, FileSignature, Layers } from 'lucide-react'

const FIELD_TYPES = [
  { value: 'text', label: '텍스트 입력', icon: Type },
  { value: 'number', label: '숫자 입력', icon: Hash },
  { value: 'select', label: '선택박스', icon: ListFilter },
  { value: 'checkbox', label: '체크박스', icon: CheckSquare },
  { value: 'date', label: '날짜 입력', icon: CalendarDays },
  { value: 'file', label: '파일 업로드', icon: Paperclip },
  { value: 'agreement', label: '서약서 동의', icon: FileSignature },
]

const EMPTY_FIELD = {
  field_type: 'text',
  label: '',
  name: '',
  description: '',
  is_required: false,
  options: '',
  app_order: 0,
}

export default function AdminFormBuilder() {
  const { id: programId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<any>(null)
  const [program, setProgram] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newField, setNewField] = useState(EMPTY_FIELD)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    const prog = await programsApi.get(Number(programId))
    setProgram(prog.data)
    try {
      const f = await formsApi.getByProgram(Number(programId))
      setForm(f.data)
    } catch {
      setForm(null)
    }
  }

  useEffect(() => { load() }, [programId])

  const handleCreateForm = async () => {
    setCreating(true)
    try {
      const f = await formsApi.create({ program_id: Number(programId), title: `${program?.title} 신청서` })
      setForm(f.data)
    } finally {
      setCreating(false)
    }
  }

  const handleAddField = async () => {
    if (!form) return
    const payload = {
      ...newField,
      name: newField.name || newField.label.toLowerCase().replace(/\s+/g, '_'),
      options: newField.options
        ? newField.options.split('\n').map((o: string, i: number) => ({ label: o.trim(), value: String(i) })).filter((o: any) => o.label)
        : null,
      app_order: form.fields?.length ?? 0,
    }
    await formsApi.addField(form.id, payload)
    setNewField(EMPTY_FIELD)
    setShowAdd(false)
    load()
  }

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm('필드를 삭제하시겠습니까?')) return
    await formsApi.deleteField(form.id, fieldId)
    load()
  }

  const getFieldIcon = (type: string) => {
    const ft = FIELD_TYPES.find(t => t.value === type)
    return ft ? ft.icon : Type
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/admin/programs')} className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-primary-600 mb-5 font-medium transition-colors">
        <ChevronLeft size={16} /> 사업 목록으로
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">신청서 폼 빌더</h2>
          <p className="text-sm text-surface-400 mt-1">{program?.title}</p>
        </div>
      </div>

      {!form ? (
        <div className="card-hover text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Layers size={28} className="text-primary-400" />
          </div>
          <p className="text-surface-500 font-semibold mb-2">신청서 폼이 없습니다</p>
          <p className="text-xs text-surface-400 mb-5">이 사업에 대한 신청서 양식을 만들어보세요</p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700
                       hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm
                       shadow-lg shadow-primary-500/20 transition-all duration-300"
            onClick={handleCreateForm}
            disabled={creating}
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {creating ? '생성 중...' : '신청서 폼 생성'}
          </button>
        </div>
      ) : (
        <>
          {/* Field list */}
          <div className="card-hover mb-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-800">질문 목록</h3>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg">
                  {form.fields?.length ?? 0}개
                </span>
              </div>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl text-sm font-bold transition-colors"
                onClick={() => setShowAdd(!showAdd)}
              >
                <Plus size={14} /> 질문 추가
              </button>
            </div>

            {form.fields?.length === 0 && (
              <div className="text-center py-10 text-surface-400 text-sm">
                <p>등록된 질문이 없습니다</p>
                <p className="text-xs text-surface-300 mt-1">위 버튼을 눌러 질문을 추가하세요</p>
              </div>
            )}

            <div className="space-y-2">
              {form.fields?.map((field: any, idx: number) => {
                const FieldIcon = getFieldIcon(field.field_type)
                return (
                  <div key={field.id} className="flex items-start gap-3 p-4 bg-surface-50/80 rounded-xl border border-surface-200/80 hover:border-primary-200 hover:bg-primary-50/30 transition-all group">
                    <GripVertical size={16} className="text-surface-300 mt-1 cursor-grab" />
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-surface-200 shadow-sm flex-shrink-0">
                      <FieldIcon size={15} className="text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">{field.label}</span>
                        {field.is_required && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-danger-50 text-danger-600 rounded">필수</span>
                        )}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded">
                          {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                        </span>
                      </div>
                      {field.description && <p className="text-xs text-surface-400 mt-1">{field.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-surface-300 bg-surface-100 px-2 py-0.5 rounded">#{idx + 1}</span>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 text-surface-300 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add field form */}
          {showAdd && (
            <div className="card-hover border-2 border-primary-200 bg-primary-50/20 animate-slide-up">
              <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Plus size={16} className="text-primary-600" /> 새 질문 추가
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">필드 타입</label>
                  <select className="input" value={newField.field_type} onChange={e => setNewField({ ...newField, field_type: e.target.value })}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newField.is_required}
                      onChange={e => setNewField({ ...newField, is_required: e.target.checked })}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium">필수 항목</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="label">질문 (표시 이름) *</label>
                <input className="input" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} placeholder="예: 기업명" />
              </div>
              <div className="mb-4">
                <label className="label">설명 (선택)</label>
                <input className="input" value={newField.description} onChange={e => setNewField({ ...newField, description: e.target.value })} placeholder="입력 도움말" />
              </div>
              {(newField.field_type === 'select' || newField.field_type === 'checkbox') && (
                <div className="mb-4">
                  <label className="label">선택 항목 (한 줄에 하나씩)</label>
                  <textarea
                    className="input h-24 resize-none"
                    value={newField.options}
                    onChange={e => setNewField({ ...newField, options: e.target.value })}
                    placeholder="항목1&#10;항목2&#10;항목3"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-surface-200">
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>취소</button>
                <button className="btn-primary" onClick={handleAddField} disabled={!newField.label}>
                  <Save size={14} /> 추가
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
