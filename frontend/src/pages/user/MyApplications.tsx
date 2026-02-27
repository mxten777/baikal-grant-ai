import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi } from '../../api/client'
import { Download, ClipboardList, ArrowRight, FileText, Brain, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; color: string; dot: string; step: number }> = {
  draft: { label: '임시저장', color: 'bg-surface-100 text-surface-500', dot: 'bg-surface-400', step: 0 },
  submitted: { label: '접수 완료', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', step: 1 },
  under_review: { label: 'AI 심사중', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', step: 2 },
  revision_requested: { label: '보완요청', color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', step: 2 },
  approved: { label: '선정', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', step: 3 },
  rejected: { label: '탈락', color: 'bg-red-50 text-red-600', dot: 'bg-red-500', step: 3 },
  completed: { label: '정산완료', color: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500', step: 4 },
}

const STEPS = ['신청', '접수', '심사', '결과', '정산']

export default function MyApplications() {
  const [apps, setApps] = useState<any[]>([])

  useEffect(() => { applicationsApi.myApplications().then(r => setApps(r.data)) }, [])

  const handleDownloadPdf = async (id: number, appNum: string) => {
    const res = await applicationsApi.downloadPdf(id)
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${appNum}.pdf`
    a.click()
  }

  const statCounts = {
    total: apps.length,
    pending: apps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
    approved: apps.filter(a => ['approved', 'completed'].includes(a.status)).length,
    action: apps.filter(a => a.status === 'revision_requested').length,
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">나의 신청 내역</h1>
          <p className="text-sm text-surface-400 mt-1">제출한 신청서의 처리 현황을 실시간으로 확인합니다</p>
        </div>
      </div>

      {/* Stats Summary */}
      {apps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card-hover !py-3">
            <p className="text-2xl font-extrabold text-gray-900">{statCounts.total}</p>
            <p className="text-xs font-semibold text-surface-400">전체 신청</p>
          </div>
          <div className="card-hover !py-3">
            <p className="text-2xl font-extrabold text-blue-600">{statCounts.pending}</p>
            <p className="text-xs font-semibold text-surface-400">진행중</p>
          </div>
          <div className="card-hover !py-3">
            <p className="text-2xl font-extrabold text-emerald-600">{statCounts.approved}</p>
            <p className="text-xs font-semibold text-surface-400">선정/완료</p>
          </div>
          <div className="card-hover !py-3">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-extrabold text-orange-600">{statCounts.action}</p>
              {statCounts.action > 0 && <AlertCircle size={16} className="text-orange-500 animate-pulse" />}
            </div>
            <p className="text-xs font-semibold text-surface-400">조치 필요</p>
          </div>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="card-hover text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-primary-400" />
          </div>
          <p className="text-surface-500 font-semibold mb-2">아직 신청한 사업이 없습니다</p>
          <p className="text-xs text-surface-400 mb-5">지원사업 목록에서 신청해보세요</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700
                       hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm
                       shadow-lg shadow-primary-500/20 transition-all duration-300"
          >
            사업 목록 보기 <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app, i) => {
            const st = STATUS_MAP[app.status] || { label: app.status, color: 'bg-surface-100 text-surface-500', dot: 'bg-surface-400', step: 0 }
            return (
              <div key={app.id} className="card-hover group" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 flex items-center justify-center">
                      <FileText size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{app.application_number}</p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {app.submission_date
                          ? `제출일: ${new Date(app.submission_date).toLocaleDateString('ko-KR')}`
                          : '임시저장 중'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-14 sm:ml-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    {app.status !== 'draft' && (
                      <button
                        onClick={() => handleDownloadPdf(app.id, app.application_number)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-surface-500
                                   bg-surface-50 hover:bg-primary-50 hover:text-primary-600 border border-surface-200
                                   rounded-lg transition-colors"
                      >
                        <Download size={13} /> PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-0 mt-2">
                  {STEPS.map((step, idx) => {
                    const isActive = idx <= st.step
                    const isCurrent = idx === st.step
                    const isRejected = app.status === 'rejected' && idx === st.step
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center relative flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                            isRejected ? 'border-red-400 bg-red-50 text-red-600' :
                            isCurrent ? 'border-primary-500 bg-primary-500 text-white shadow-md shadow-primary-500/30' :
                            isActive ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                            'border-surface-200 bg-white text-surface-400'
                          }`}>
                            {isActive && !isCurrent ? <CheckCircle2 size={12} /> : idx + 1}
                          </div>
                          <span className={`text-[9px] font-semibold mt-1 ${
                            isCurrent ? 'text-primary-600' : isActive ? 'text-emerald-600' : 'text-surface-300'
                          }`}>{step}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 -mt-3 mx-0.5 rounded ${
                            idx < st.step ? 'bg-emerald-300' : 'bg-surface-200'
                          }`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* AI hint if under_review */}
                {app.status === 'under_review' && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-primary-50 rounded-lg border border-primary-200">
                    <Brain size={14} className="text-primary-600" />
                    <span className="text-[11px] font-semibold text-primary-700">AI 심사가 진행 중입니다. 결과가 나오면 알려드릴게요.</span>
                  </div>
                )}
                {app.status === 'revision_requested' && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertCircle size={14} className="text-orange-600" />
                    <span className="text-[11px] font-semibold text-orange-700">보완 요청 사항이 있습니다. 신청서를 확인해주세요.</span>
                  </div>
                )}
                {app.status === 'approved' && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-[11px] font-semibold text-emerald-700">축하합니다! 선정되었습니다. 협약 절차를 진행해주세요.</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
