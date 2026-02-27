import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formsApi, applicationsApi, programsApi } from '../../api/client'
import { Save, Send, Upload, CheckCircle2, FileText, AlertCircle } from 'lucide-react'

export default function ApplyForm() {
  const { id: programId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [appId, setAppId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    programsApi.get(Number(programId)).then(r => setProgram(r.data))
    formsApi.getByProgram(Number(programId)).then(r => setForm(r.data))
  }, [programId])

  const buildAnswers = () =>
    form?.fields
      ?.filter((f: any) => f.field_type !== 'file')
      .map((f: any) => ({ field_id: f.id, value: answers[f.id] || '' })) ?? []

  const handleSave = async () => {
    const res = await applicationsApi.create({
      program_id: Number(programId),
      answers: buildAnswers(),
    })
    setAppId(res.data.id)
    setSaved(true)
    return res.data.id
  }

  const handleFileUpload = async (fieldId: number, file: File, id: number) => {
    await applicationsApi.uploadFile(id, file, fieldId)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const id = appId ?? (await handleSave())
      for (const field of form?.fields ?? []) {
        if (field.field_type === 'file') {
          const fileInput = fileRefs.current[field.id]
          if (fileInput?.files?.[0]) {
            await handleFileUpload(field.id, fileInput.files[0], id)
          }
        }
      }
      await applicationsApi.submit(id)
      navigate('/my-applications')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: any) => {
    const val = answers[field.id] ?? ''
    const set = (v: string) => setAnswers(p => ({ ...p, [field.id]: v }))

    switch (field.field_type) {
      case 'text':
        return <input className="input" value={val} onChange={e => set(e.target.value)} placeholder={field.description || '입력하세요'} />
      case 'number':
        return <input type="number" className="input" value={val} onChange={e => set(e.target.value)} placeholder="0" />
      case 'date':
        return <input type="date" className="input" value={val} onChange={e => set(e.target.value)} />
      case 'select':
        return (
          <select className="input" value={val} onChange={e => set(e.target.value)}>
            <option value="">선택하세요</option>
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <div className="space-y-2 p-3 bg-surface-50 rounded-xl">
            {field.options?.map((opt: any) => (
              <label key={opt.value} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={val.split(',').includes(opt.value)}
                  onChange={e => {
                    const parts = val ? val.split(',').filter(Boolean) : []
                    if (e.target.checked) set([...parts, opt.value].join(','))
                    else set(parts.filter(p => p !== opt.value).join(','))
                  }}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )
      case 'file':
        return (
          <div className="flex items-center gap-3">
            <input
              type="file"
              className="hidden"
              ref={el => { fileRefs.current[field.id] = el }}
              onChange={e => set(e.target.files?.[0]?.name ?? '')}
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-50 border-2 border-dashed border-surface-300
                         hover:border-primary-400 hover:bg-primary-50 rounded-xl text-sm font-semibold text-surface-500
                         hover:text-primary-600 transition-all"
              onClick={() => fileRefs.current[field.id]?.click()}
            >
              <Upload size={15} /> 파일 선택
            </button>
            {val && (
              <span className="flex items-center gap-1.5 text-sm text-success-600 font-medium">
                <CheckCircle2 size={14} /> {val}
              </span>
            )}
          </div>
        )
      case 'agreement':
        return (
          <label className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200 cursor-pointer select-none hover:border-primary-300 transition-colors">
            <input
              type="checkbox"
              checked={val === 'true'}
              onChange={e => set(String(e.target.checked))}
              className="w-4 h-4 mt-0.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 leading-relaxed">{field.description || '위 내용에 동의합니다.'}</span>
          </label>
        )
      default:
        return <input className="input" value={val} onChange={e => set(e.target.value)} />
    }
  }

  if (!form) return (
    <div className="flex items-center gap-3 text-surface-400 py-12">
      <div className="w-5 h-5 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
      불러오는 중...
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="card-hover mb-6 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <FileText size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{program?.title}</h1>
            <p className="text-xs text-surface-400 font-medium">신청서를 작성하고 제출해주세요</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {form.fields?.map((field: any, i: number) => (
          <div key={field.id} className="card-hover animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <label className="text-sm font-bold text-gray-800">
                {field.label}
                {field.is_required && <span className="text-danger-500 ml-1">*</span>}
              </label>
            </div>
            {field.description && field.field_type !== 'agreement' && (
              <p className="text-xs text-surface-400 mb-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> {field.description}
              </p>
            )}
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-surface-200">
        <button className="btn-secondary" onClick={handleSave} disabled={saved}>
          <Save size={15} /> {saved ? '임시저장됨' : '임시저장'}
        </button>
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700
                     hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm
                     shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={15} />
          )}
          {submitting ? '제출 중...' : '최종 제출'}
        </button>
      </div>
    </div>
  )
}
