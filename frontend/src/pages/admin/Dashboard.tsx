import { useEffect, useState } from 'react'
import { dashboardApi } from '../../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import {
  Users, Layers, CheckCircle, Clock, TrendingUp, Activity,
  Banknote, Target, Percent, UserCheck,
  Zap, Award, BarChart3
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: '임시저장', submitted: '접수', under_review: '검토중',
  revision_requested: '보완요청', approved: '선정', rejected: '탈락', completed: '정산완료',
}
const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8', submitted: '#3b82f6', under_review: '#f59e0b',
  revision_requested: '#f97316', approved: '#10b981', rejected: '#ef4444', completed: '#6366f1',
}
const ACTION_LABELS: Record<string, string> = {
  submit: '신청서 제출', review: '검토 시작', approve: '선정 승인',
  reject: '탈락 처리', revision: '보완 요청', complete: '정산 완료',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-elevated border border-surface-100">
        <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>
        <p className="text-lg font-extrabold text-primary-600">{payload[0].value}건</p>
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-elevated border border-surface-100">
        <p className="text-xs font-bold text-gray-700 mb-1">{payload[0].name}</p>
        <p className="text-lg font-extrabold" style={{ color: payload[0].payload.fill }}>{payload[0].value}건</p>
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [programStats, setProgramStats] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  useEffect(() => {
    dashboardApi.summary().then(r => setSummary(r.data))
    dashboardApi.recentApplications(8).then(r => setRecent(r.data))
    dashboardApi.programStats().then(r => setProgramStats(r.data))
    dashboardApi.activityLogs(12).then(r => setActivityLogs(r.data))
  }, [])

  const chartData = summary
    ? Object.entries(summary.by_status as Record<string, number>).map(([key, value]) => ({
        name: STATUS_LABELS[key] || key, count: value, color: STATUS_COLORS[key] || '#94a3b8',
      }))
    : []

  const pieData = summary
    ? Object.entries(summary.by_status as Record<string, number>).map(([key, value]) => ({
        name: STATUS_LABELS[key] || key, value, fill: STATUS_COLORS[key] || '#94a3b8',
      }))
    : []

  const stats = [
    { label: '전체 신청', value: summary?.total_applications ?? '-', delta: '+12%', icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-500/20' },
    { label: '진행중 사업', value: summary?.active_programs ?? '-', delta: `${summary?.total_programs ?? 0}개 중`, icon: Layers, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-500/20' },
    { label: '선정률', value: summary?.approval_rate != null ? `${summary.approval_rate}%` : '-', delta: '전체 기준', icon: Percent, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', ring: 'ring-amber-500/20' },
    { label: '선정 건수', value: (summary?.by_status?.approved ?? 0) + (summary?.by_status?.completed ?? 0), delta: '승인+완료', icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', ring: 'ring-emerald-500/20' },
    { label: '등록 사용자', value: summary?.total_users ?? '-', delta: '일반회원', icon: UserCheck, gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50', ring: 'ring-cyan-500/20' },
    { label: '총 예산', value: summary?.total_budget ? `${(summary.total_budget / 100000000).toFixed(0)}억` : '-', delta: '전체 사업', icon: Banknote, gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', ring: 'ring-rose-500/20' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">대시보드</h2>
          <p className="text-sm text-surface-400 mt-1">BAIKAL Grant AI 보조금 지원사업 현황을 한눈에 확인합니다</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-surface-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <span className="text-xs font-semibold text-surface-500">실시간</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200">
            <Zap size={13} className="text-primary-600" />
            <span className="text-xs font-bold text-primary-700">AI 분석 활성</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {stats.map(({ label, value, delta, icon: Icon, gradient, bg, ring }, i) => (
          <div key={label} className="group card-hover relative overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-4 ${ring}`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
              <p className="text-[11px] font-semibold text-surface-400 mt-1">{label}</p>
              <p className="text-[10px] font-bold text-primary-500 mt-0.5">{delta}</p>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 ${bg} rounded-full opacity-40 group-hover:opacity-70 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Bar Chart */}
        <div className="lg:col-span-2 card-hover">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-500" /> 상태별 신청 현황
              </h3>
              <p className="text-xs text-surface-400 mt-0.5">전체 신청서의 진행 상태 분포</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-lg">
              <TrendingUp size={13} className="text-primary-600" />
              <span className="text-xs font-bold text-primary-600">총 {summary?.total_applications ?? 0}건</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }} />
              <Bar dataKey="count" radius={[8, 8, 4, 4]} barSize={36}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card-hover">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Target size={16} className="text-amber-500" /> 상태 비율
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">도넛 차트로 한눈에 보기</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none" />
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-3">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-[10px] font-semibold text-surface-500">{d.name} {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Programs Table + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Program Stats */}
        <div className="lg:col-span-3 card-hover">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Award size={16} className="text-purple-500" /> 사업별 현황
            </h3>
            <span className="text-xs font-bold text-surface-400">{programStats.length}개 사업</span>
          </div>
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider">사업명</th>
                  <th className="text-center py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider w-20">상태</th>
                  <th className="text-center py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider w-16">신청</th>
                  <th className="text-center py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider w-16">선정</th>
                  <th className="text-right py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider w-24">예산</th>
                </tr>
              </thead>
              <tbody>
                {programStats.map((p: any) => (
                  <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-gray-800 truncate max-w-[200px] lg:max-w-[280px]">{p.title}</p>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'}`}>
                        {p.status === 'active' ? '진행중' : '마감'}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-gray-700">{p.application_count}</td>
                    <td className="py-3 text-center font-bold text-emerald-600">{p.approved_count}</td>
                    <td className="py-3 text-right text-xs font-semibold text-surface-500">
                      {p.budget_amount ? `${(p.budget_amount / 10000).toLocaleString()}만원` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 card-hover">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-cyan-500" /> 최근 활동
            </h3>
          </div>
          <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1">
            {activityLogs.map((log: any, i: number) => {
              const newColor = STATUS_COLORS[log.new_status] || '#94a3b8'
              return (
                <div key={log.id} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-surface-50 transition-colors" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${newColor}15` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: newColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      <span className="text-primary-600">{log.actor_name}</span>
                      {' · '}
                      <span>{ACTION_LABELS[log.action] || log.action}</span>
                    </p>
                    <p className="text-[10px] text-surface-400 truncate">{log.application_number}</p>
                    {log.comments && (
                      <p className="text-[10px] text-surface-500 mt-0.5 truncate">&ldquo;{log.comments}&rdquo;</p>
                    )}
                  </div>
                  <span className="text-[10px] text-surface-300 flex-shrink-0 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              )
            })}
            {activityLogs.length === 0 && (
              <div className="text-center py-8 text-surface-400 text-sm">활동 내역이 없습니다</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Applications Detail */}
      <div className="card-hover">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> 최근 신청서
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">최신 접수된 신청서 상세 정보</p>
          </div>
        </div>
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider">신청번호</th>
                <th className="text-left py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider">신청자</th>
                <th className="text-left py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider hidden sm:table-cell">사업명</th>
                <th className="text-center py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider">상태</th>
                <th className="text-right py-2.5 text-[11px] font-bold text-surface-400 uppercase tracking-wider">신청일</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((app: any) => {
                const color = STATUS_COLORS[app.status] || '#94a3b8'
                return (
                  <tr key={app.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors group cursor-pointer">
                    <td className="py-3">
                      <span className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{app.application_number}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-medium text-gray-700">{app.user_name || `사용자 #${app.user_id}`}</span>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className="text-surface-500 truncate max-w-[220px] inline-block">{app.program_title || '-'}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-surface-400">
                      {app.submission_date ? new Date(app.submission_date).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {recent.length === 0 && (
          <div className="text-center py-8 text-surface-400 text-sm">아직 신청 내역이 없습니다</div>
        )}
      </div>
    </div>
  )
}
