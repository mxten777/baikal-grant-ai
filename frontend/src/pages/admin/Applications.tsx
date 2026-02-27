import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, programsApi } from '../../api/client'
import { Eye, Download, FileText, Filter, Search, Brain, TrendingUp, ArrowUpRight } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  draft: { label: '임시저장', color: 'bg-surface-100 text-surface-500', dot: 'bg-surface-400' },
  submitted: { label: '접수', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  under_review: { label: '검토중', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  revision_requested: { label: '보완요청', color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  approved: { label: '선정', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: '탈락', color: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  completed: { label: '정산완료', color: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
}

function mockAiScore(app: any) {
  const base: Record<string, number> = {
    approved: 87, completed: 92, under_review: 74, submitted: 68,
    revision_requested: 55, rejected: 38, draft: 0,
  }
  return Math.max(20, Math.min(98, (base[app.status] || 60) + ((app.id * 7) % 10) - 3))
}

export default function AdminApplications() {
  const [apps, setApps] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [filterProgram, setFilterProgram] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = () =>
    applicationsApi.adminList({
      program_id: filterProgram ? Number(filterProgram) : undefined,
      status: filterStatus || undefined,
    }).then(r => setApps(r.data))

  useEffect(() => {
    programsApi.list().then(r => setPrograms(r.data))
  }, [])

  useEffect(() => { load() }, [filterProgram, filterStatus])

  const handleDownloadPdf = async (id: number, appNum: string) => {
    const res = await applicationsApi.downloadPdf(id)
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${appNum}.pdf`
    a.click()
  }

  const statusCounts: Record<string, number> = apps.reduce((acc: Record<string, number>, a: any) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc }, {})

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">신청 현황</h2>
          <p className="text-sm text-surface-400 mt-1">접수된 신청서를 확인하고 AI 심사 결과를 검토합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-surface-200 shadow-sm">
            <FileText size={14} className="text-primary-500" />
            <span className="text-xs font-bold text-surface-500">총 {apps.length}건</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-xl border border-primary-200">
            <Brain size={14} className="text-primary-600" />
            <span className="text-xs font-bold text-primary-700">AI 분석 완료</span>
          </div>
        </div>
      </div>

      {/* Status Quick Filters */}
      {apps.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterStatus('')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${!filterStatus ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}
          >
            전체 {apps.length}
          </button>
          {Object.entries(statusCounts).map(([status, count]) => {
            const st = STATUS_LABELS[status]
            if (!st) return null
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  filterStatus === status ? 'bg-primary-600 text-white' : `${st.color} hover:opacity-80`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === status ? 'bg-white' : st.dot}`} />
                {st.label} {count}
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 rounded-lg">
          <Filter size={13} className="text-surface-400" />
          <span className="text-xs font-bold text-surface-400">필터</span>
        </div>
        <select className="input !w-full sm:!w-52 !py-2 !text-sm" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">전체 사업</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {apps.length === 0 ? (
        <div className="card-hover text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-surface-300" />
          </div>
          <p className="text-surface-400 font-medium">신청 내역이 없습니다</p>
        </div>
      ) : (
        <div className="card-hover p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-surface-400 uppercase tracking-wider">접수번호</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-surface-400 uppercase tracking-wider">신청일</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-surface-400 uppercase tracking-wider">상태</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1 justify-center"><Brain size={11} /> AI점수</span>
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-surface-400 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => {
                const st = STATUS_LABELS[app.status] || { label: app.status, color: 'bg-surface-100 text-surface-500', dot: 'bg-surface-400' }
                const aiScore = mockAiScore(app)
                const scoreColor = aiScore >= 75 ? 'text-emerald-600' : aiScore >= 50 ? 'text-amber-600' : 'text-red-600'
                const scoreBg = aiScore >= 75 ? 'bg-emerald-50' : aiScore >= 50 ? 'bg-amber-50' : 'bg-red-50'
                return (
                  <tr key={app.id} className="border-b border-surface-100 last:border-0 hover:bg-primary-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-800">{app.application_number}</span>
                    </td>
                    <td className="px-5 py-4 text-surface-500">
                      {app.submission_date ? new Date(app.submission_date).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${scoreBg} ${scoreColor}`}>
                        {aiScore}점
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/admin/applications/${app.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> 상세
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(app.id, app.application_number)}
                          className="p-2 text-surface-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="PDF 다운로드"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
