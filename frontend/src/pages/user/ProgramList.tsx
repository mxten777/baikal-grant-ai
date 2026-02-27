import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { programsApi } from '../../api/client'
import {
  Calendar, Banknote, ArrowRight, Search, Sparkles, FolderOpen,
  Brain, ShieldCheck, Clock, Zap, FileCheck, BarChart3,
  ChevronRight, Rocket, Users, Award
} from 'lucide-react'

export default function ProgramList() {
  const [programs, setPrograms] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { programsApi.list().then(r => setPrograms(r.data)) }, [])

  const activePrograms = programs.filter(p => p.status === 'active')
  const closedPrograms = programs.filter(p => p.status === 'closed')
  const filtered = activePrograms.filter(
    p => p.title.toLowerCase().includes(search.toLowerCase())
  )

  const features = [
    { icon: Brain, title: 'AI 자동 심사', desc: '인공지능이 신청서를 분석하여 적격성을 자동 판단합니다', gradient: 'from-violet-500 to-purple-600' },
    { icon: ShieldCheck, title: '투명한 프로세스', desc: '신청부터 선정까지 모든 단계를 실시간으로 확인할 수 있습니다', gradient: 'from-emerald-500 to-teal-600' },
    { icon: Zap, title: '빠른 처리', desc: 'AI 기반 자동화로 기존 대비 3배 빠른 심사 처리가 가능합니다', gradient: 'from-amber-500 to-orange-600' },
    { icon: FileCheck, title: '간편한 신청', desc: '직관적인 양식으로 누구나 쉽게 보조금을 신청할 수 있습니다', gradient: 'from-blue-500 to-cyan-600' },
  ]

  const steps = [
    { num: '01', title: '사업 확인', desc: '지원 가능한 사업을 확인하세요' },
    { num: '02', title: '온라인 신청', desc: '간편한 양식으로 신청서를 작성합니다' },
    { num: '03', title: 'AI 심사', desc: 'AI가 1차 적격성을 자동으로 판단합니다' },
    { num: '04', title: '결과 안내', desc: '선정 결과를 실시간으로 확인합니다' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 sm:p-10 lg:p-14 mb-8 sm:mb-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-primary-200 text-sm font-semibold mb-4">
            <Sparkles size={14} /> BAIKAL Grant AI
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3 leading-tight">
            AI가 지원하는<br />스마트 보조금 관리
          </h1>
          <p className="text-primary-200 text-sm sm:text-base lg:text-lg max-w-lg leading-relaxed mb-6">
            인공지능 기반의 보조금 심사·관리 플랫폼으로 투명하고 효율적인 지원사업을 경험하세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <Rocket size={16} className="text-accent-400" />
              <span className="text-sm font-bold text-white">{activePrograms.length}개 사업 접수중</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <Users size={16} className="text-emerald-300" />
              <span className="text-sm font-bold text-white">총 {programs.length}개 지원사업</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {features.map(({ icon: Icon, title, desc, gradient }, i) => (
          <div key={title} className="card-hover group text-center" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
              <Icon size={22} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
            <p className="text-xs text-surface-400 leading-relaxed hidden sm:block">{desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-surface-50 to-primary-50/30 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10">
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">신청 프로세스</h2>
          <p className="text-sm text-surface-400 mt-1">4단계의 간편한 절차로 보조금을 신청하세요</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={step.num} className="text-center relative" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-primary-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <span className="text-lg font-extrabold text-primary-600">{step.num}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-800">{step.title}</h4>
              <p className="text-xs text-surface-400 mt-1 hidden sm:block">{step.desc}</p>
              {i < steps.length - 1 && (
                <ChevronRight size={16} className="hidden sm:block text-primary-300 absolute top-5 -right-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Programs Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-xs font-bold text-success-600 uppercase tracking-wider">접수중</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">지원사업 목록</h2>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              className="w-full sm:w-72 pl-11 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-sm font-medium
                         placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 shadow-sm transition-all"
              placeholder="사업명으로 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((p, i) => (
            <div key={p.id} className="card-hover group" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-success-50 text-success-700 rounded uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" /> 접수중
                    </span>
                    {p.budget_amount >= 100000000 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                        <Award size={10} /> 대규모
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-primary-700 transition-colors">{p.title}</h2>
                  <p className="text-sm text-surface-500 mt-1 line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-3 text-xs text-surface-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-primary-400" />
                      접수: {p.apply_start_date?.slice(0, 10)} ~ {p.apply_end_date?.slice(0, 10)}
                    </span>
                    {p.budget_amount && (
                      <span className="flex items-center gap-1.5">
                        <Banknote size={13} className="text-success-500" />
                        최대 {Number(p.budget_amount).toLocaleString()}원
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-400" />
                      사업기간: {p.start_date?.slice(0, 10)} ~ {p.end_date?.slice(0, 10)}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/programs/${p.id}`}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700
                             hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm
                             shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-300 w-full sm:w-auto justify-center"
                >
                  자세히 보기 <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card-hover text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={28} className="text-surface-300" />
              </div>
              <p className="text-surface-400 font-semibold">현재 접수 중인 사업이 없습니다</p>
              <p className="text-xs text-surface-300 mt-1">나중에 다시 확인해주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Closed Programs */}
      {closedPrograms.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-surface-400" />
            <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">마감된 사업</span>
          </div>
          <div className="grid gap-3">
            {closedPrograms.map((p) => (
              <div key={p.id} className="card-hover opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-100 text-surface-500 rounded">마감</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-600">{p.title}</h3>
                    <p className="text-xs text-surface-400 mt-1 line-clamp-1">{p.description}</p>
                  </div>
                  <Link to={`/programs/${p.id}`} className="text-xs font-bold text-surface-400 hover:text-primary-600 flex items-center gap-1 transition-colors">
                    상세보기 <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Stats */}
      <div className="mt-10 mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold mb-4">
          <BarChart3 size={14} /> BAIKAL Grant AI 플랫폼
        </div>
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{programs.length}</p>
            <p className="text-xs text-gray-400 mt-1">등록 사업</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-accent-400">AI</p>
            <p className="text-xs text-gray-400 mt-1">자동 심사</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">3x</p>
            <p className="text-xs text-gray-400 mt-1">처리 속도</p>
          </div>
        </div>
      </div>
    </div>
  )
}
