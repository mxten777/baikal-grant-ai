import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { applicationsApi } from '../../api/client'
import {
  ChevronLeft, Download, FileText, Paperclip, Clock, ArrowRight, Send, MessageSquare,
  Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, XCircle, BarChart3,
  Shield, Lightbulb, Target
} from 'lucide-react'

const STATUS_LIST = [
  { value: 'submitted', label: '접수', color: '#3b82f6' },
  { value: 'under_review', label: '검토중', color: '#f59e0b' },
  { value: 'revision_requested', label: '보완요청', color: '#f97316' },
  { value: 'approved', label: '선정', color: '#10b981' },
  { value: 'rejected', label: '탈락', color: '#ef4444' },
  { value: 'completed', label: '정산완료', color: '#6366f1' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8', submitted: '#3b82f6', under_review: '#f59e0b',
  revision_requested: '#f97316', approved: '#10b981', rejected: '#ef4444', completed: '#6366f1',
}

// Mock AI scoring based on application status for demo
function generateAiScore(app: any) {
  const baseScores: Record<string, number> = {
    approved: 87, completed: 92, under_review: 74, submitted: 68,
    revision_requested: 55, rejected: 38, draft: 0,
  }
  const base = baseScores[app.status] || 60
  const jitter = (app.id * 7) % 10 - 3
  const total = Math.max(20, Math.min(98, base + jitter))

  return {
    total,
    categories: [
      { name: '서류 완성도', score: Math.min(100, total + 8), maxScore: 100 },
      { name: '사업 타당성', score: Math.min(100, total - 3), maxScore: 100 },
      { name: '기술 혁신성', score: Math.min(100, total + 2), maxScore: 100 },
      { name: '재무 건전성', score: Math.min(100, total - 7), maxScore: 100 },
      { name: '지원 자격 적합성', score: Math.min(100, total + 12), maxScore: 100 },
    ],
    recommendation: total >= 75 ? 'approve' : total >= 50 ? 'review' : 'reject',
    insights: total >= 75
      ? ['사업계획서의 완성도가 높습니다', '기술 혁신성이 우수한 것으로 판단됩니다', '재무 안정성 지표가 양호합니다']
      : total >= 50
        ? ['일부 서류 보완이 필요합니다', '사업 타당성에 대한 추가 검토가 필요합니다', '시장 분석 자료를 보강하면 좋겠습니다']
        : ['필수 서류가 누락되어 있습니다', '지원 자격 요건 미달 항목이 있습니다', '사업계획서 재작성을 권장합니다'],
    riskLevel: total >= 75 ? 'low' : total >= 50 ? 'medium' : 'high',
  }
}

export default function AdminApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [showAiDetail, setShowAiDetail] = useState(false)

  const load = () => applicationsApi.get(Number(id)).then(r => { setApp(r.data); setNewStatus(r.data.status) })
  useEffect(() => { load() }, [id])

  const handleStatusUpdate = async () => {
    await applicationsApi.updateStatus(Number(id), newStatus, comment)
    setComment('')
    load()
  }

  const handleDownloadPdf = async () => {
    const res = await applicationsApi.downloadPdf(Number(id))
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a'); a.href = url; a.download = `${app.application_number}.pdf`; a.click()
  }

  if (!app) return (
    <div className="p-8 flex items-center gap-3 text-surface-400">
      <div className="w-5 h-5 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
      불러오는 중...
    </div>
  )

  const color = STATUS_COLORS[app.status] || '#94a3b8'
  const statusLabel = STATUS_LIST.find(s => s.value === app.status)?.label || app.status
  const aiScore = generateAiScore(app)

  const scoreColor = aiScore.total >= 75 ? '#10b981' : aiScore.total >= 50 ? '#f59e0b' : '#ef4444'
  const scoreBg = aiScore.total >= 75 ? 'from-emerald-500 to-green-600' : aiScore.total >= 50 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600'
  const recLabel = aiScore.recommendation === 'approve' ? '선정 추천' : aiScore.recommendation === 'review' ? '추가 검토 필요' : '반려 권고'
  const RecIcon = aiScore.recommendation === 'approve' ? CheckCircle2 : aiScore.recommendation === 'review' ? AlertTriangle : XCircle

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-primary-600 mb-5 font-medium transition-colors">
        <ChevronLeft size={16} /> 목록으로
      </button>

      {/* Header */}
      <div className="card-hover mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{app.application_number}</h2>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-surface-400">
              신청일: {app.submission_date ? new Date(app.submission_date).toLocaleString('ko-KR') : '-'}
            </p>
          </div>
          <button onClick={handleDownloadPdf} className="btn-secondary">
            <Download size={15} /> PDF 다운로드
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Answers & Files */}
        <div className="lg:col-span-2 space-y-5">
          {/* Answers */}
          <div className="card-hover">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <FileText size={16} className="text-primary-600" />
              </div>
              <h3 className="text-base font-bold text-gray-800">신청 내용</h3>
              <span className="text-xs font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded">{app.answers.length}항목</span>
            </div>
            {app.answers.length === 0
              ? <p className="text-sm text-surface-400 text-center py-8">내용 없음</p>
              : (
                <div className="space-y-0 divide-y divide-surface-100">
                  {app.answers.map((ans: any) => (
                    <div key={ans.id} className="py-3.5 first:pt-0 last:pb-0">
                      <p className="text-[11px] font-bold text-surface-400 uppercase tracking-wide mb-1">Field #{ans.field_id}</p>
                      <p className="text-sm text-gray-800 font-medium">{ans.value || JSON.stringify(ans.value_json) || '-'}</p>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Files */}
          {app.files.length > 0 && (
            <div className="card-hover">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Paperclip size={16} className="text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">첨부파일</h3>
                <span className="text-xs font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded">{app.files.length}개</span>
              </div>
              <div className="space-y-2">
                {app.files.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200/80">
                    <div className="w-9 h-9 rounded-lg bg-white border border-surface-200 flex items-center justify-center">
                      <Paperclip size={14} className="text-surface-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 flex-1">{f.file_name}</span>
                    <span className="text-xs text-surface-400">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <div className="card-hover border-2 border-primary-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Send size={16} className="text-primary-600" />
              </div>
              <h3 className="text-base font-bold text-gray-800">상태 변경</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">변경할 상태</label>
                <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="label">메모</label>
              <textarea className="input h-20 resize-none" value={comment} onChange={e => setComment(e.target.value)} placeholder="상태 변경 사유를 입력하세요..." />
            </div>
            <button className="btn-primary" onClick={handleStatusUpdate}>
              <Send size={14} /> 상태 저장
            </button>
          </div>

          {/* Workflow logs */}
          <div className="card-hover">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center">
                <Clock size={16} className="text-surface-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800">처리 이력</h3>
              <span className="text-xs font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded">{app.logs.length}건</span>
            </div>
            {app.logs.length === 0
              ? <p className="text-sm text-surface-400 text-center py-8">이력 없음</p>
              : (
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-surface-200" />
                  <div className="space-y-4">
                    {[...app.logs].reverse().map((log: any) => {
                      const logColor = STATUS_COLORS[log.new_status] || '#94a3b8'
                      return (
                        <div key={log.id} className="relative flex items-start gap-4 pl-1">
                          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white" style={{ backgroundColor: `${logColor}20` }}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: logColor }} />
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${STATUS_COLORS[log.previous_status]}15`, color: STATUS_COLORS[log.previous_status] }}>
                                {STATUS_LIST.find(s => s.value === log.previous_status)?.label || log.previous_status}
                              </span>
                              <ArrowRight size={12} className="text-surface-300" />
                              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${logColor}15`, color: logColor }}>
                                {STATUS_LIST.find(s => s.value === log.new_status)?.label || log.new_status}
                              </span>
                              <span className="text-[11px] text-surface-400">{new Date(log.created_at).toLocaleString('ko-KR')}</span>
                            </div>
                            {log.comments && (
                              <div className="flex items-start gap-1.5 mt-1.5">
                                <MessageSquare size={12} className="text-surface-300 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-surface-500">{log.comments}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }
          </div>
        </div>

        {/* Right Column - AI Analysis */}
        <div className="space-y-5">
          {/* AI Score Card */}
          <div className="card-hover border border-primary-200 bg-gradient-to-b from-white to-primary-50/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">AI 심사 분석</h3>
                <p className="text-[10px] text-surface-400">BAIKAL AI Engine v2.1</p>
              </div>
            </div>

            {/* Score Circle */}
            <div className="flex flex-col items-center py-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle cx="60" cy="60" r="52" stroke={scoreColor} strokeWidth="8" fill="none"
                    strokeDasharray={`${(aiScore.total / 100) * 327} 327`}
                    strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold" style={{ color: scoreColor }}>{aiScore.total}</span>
                  <span className="text-[10px] font-bold text-surface-400">/ 100점</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${scoreColor}15` }}>
                <RecIcon size={14} style={{ color: scoreColor }} />
                <span className="text-xs font-bold" style={{ color: scoreColor }}>{recLabel}</span>
              </div>
            </div>

            {/* Category Scores */}
            <div className="space-y-3 mt-2">
              {aiScore.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-surface-500">{cat.name}</span>
                    <span className="text-[11px] font-bold text-gray-700">{cat.score}점</span>
                  </div>
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.score}%`,
                        backgroundColor: cat.score >= 75 ? '#10b981' : cat.score >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="card-hover">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Lightbulb size={16} className="text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">AI 인사이트</h3>
            </div>
            <div className="space-y-2.5">
              {aiScore.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <Sparkles size={13} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  <span className="text-surface-600 text-xs leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="card-hover">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <Shield size={16} className="text-rose-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">리스크 평가</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: '서류 누락 위험', level: aiScore.riskLevel === 'high' ? 'high' : 'low' },
                { label: '자격 미달 위험', level: aiScore.riskLevel },
                { label: '중복 수혜 의심', level: 'low' },
              ].map((risk) => (
                <div key={risk.label} className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">{risk.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    risk.level === 'high' ? 'bg-red-50 text-red-600' :
                    risk.level === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {risk.level === 'high' ? '높음' : risk.level === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
