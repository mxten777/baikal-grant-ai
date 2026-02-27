import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { programsApi, formsApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import {
  Calendar, Banknote, FileText, ChevronLeft, ArrowRight, Shield, CheckCircle2,
  Target, Users, Clock, HelpCircle, ChevronDown, Brain, Award, AlertTriangle,
  Info, Building2, Sparkles
} from 'lucide-react'

// Mock eligibility data based on program description
const getEligibility = (title: string) => {
  if (title.includes('AI') || title.includes('스타트업')) return [
    '설립 7년 이내의 중소기업 또는 예비창업자',
    'AI/딥러닝 기반 핵심 기술 보유 기업',
    '상시 근로자 5인 이상 (예비창업자 제외)',
    '신청일 기준 사업자등록 완료 기업',
    '정부 보조금 중복 수혜가 아닌 기업',
  ]
  if (title.includes('친환경') || title.includes('그린')) return [
    '환경 관련 기술 보유 중소·중견기업',
    'ESG 경영 도입 또는 추진 중인 기업',
    '탄소 저감 목표를 수립한 기업',
    '환경부 인증 또는 ISO 14001 보유 기업 우대',
  ]
  if (title.includes('헬스케어') || title.includes('의료')) return [
    '디지털 헬스케어 R&D 역량 보유 기관',
    '의료기기 또는 바이오 분야 사업자',
    'IRB 승인 경험이 있는 연구기관',
    'FDA 또는 식약처 인허가 추진 실적 우대',
  ]
  if (title.includes('스마트팜') || title.includes('농업')) return [
    '농업경영체 등록이 완료된 농가 또는 법인',
    '스마트팜 도입 의향이 있는 시설재배 농가',
    '농지 면적 500평 이상 보유 농업인',
  ]
  return [
    '관련 분야 사업자등록 완료 기업 또는 개인',
    '정부 보조금 부정수급 이력이 없는 자',
    '세금 체납 사실이 없는 자',
  ]
}

const getFaq = (title: string) => {
  const base = [
    { q: '중복 신청이 가능한가요?', a: '동일 연도 내 동일 목적의 정부 보조금과 중복 신청은 불가합니다. 다만, 사업 유형이 다른 경우 별도 심사를 통해 허용될 수 있습니다.' },
    { q: '신청 후 수정이 가능한가요?', a: '제출 전(임시저장 상태)에는 자유롭게 수정할 수 있습니다. 제출 후에는 관리자의 보완 요청이 있을 때만 수정이 가능합니다.' },
    { q: '선정 결과는 언제 확인할 수 있나요?', a: '접수 마감 후 약 4~6주 이내에 결과가 통보됩니다. BAIKAL Grant AI의 AI 자동 심사 기능으로 기존 대비 더 빠른 결과 확인이 가능합니다.' },
    { q: '사업비는 어떻게 지급되나요?', a: '선정 후 협약 체결 완료 시 1차 지급(70%)이 이루어지며, 중간 실적 보고 후 잔액(30%)이 지급됩니다.' },
  ]
  return base
}

export default function ProgramDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [program, setProgram] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    programsApi.get(Number(id)).then(r => setProgram(r.data))
    formsApi.getByProgram(Number(id)).then(r => setForm(r.data)).catch(() => setForm(null))
  }, [id])

  if (!program) return (
    <div className="flex items-center gap-3 text-surface-400 py-12">
      <div className="w-5 h-5 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
      불러오는 중...
    </div>
  )

  const isOpen = program.status === 'active'
  const fieldTypeLabel: Record<string, string> = {
    text: '텍스트', number: '숫자', select: '선택', checkbox: '체크박스',
    date: '날짜', file: '파일 업로드', agreement: '서약서 동의',
  }
  const eligibility = getEligibility(program.title)
  const faq = getFaq(program.title)

  const budget = Number(program.budget_amount) || 0

  return (
    <div className="max-w-3xl animate-fade-in">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-primary-600 mb-5 font-medium transition-colors">
        <ChevronLeft size={16} /> 목록으로
      </Link>

      {/* Main info */}
      <div className="card-hover mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                isOpen ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-success-500 animate-pulse' : 'bg-surface-400'}`} />
                {isOpen ? '접수중' : '마감'}
              </span>
              {budget >= 100000000 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                  <Award size={10} /> 대규모 사업
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{program.title}</h1>
          </div>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">{program.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Calendar size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-surface-400">사업기간</p>
              <p className="text-sm font-semibold text-gray-700">{program.start_date?.slice(0, 10)} ~ {program.end_date?.slice(0, 10)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-surface-400">접수기간</p>
              <p className="text-sm font-semibold text-gray-700">{program.apply_start_date?.slice(0, 10)} ~ {program.apply_end_date?.slice(0, 10)}</p>
            </div>
          </div>
          {budget > 0 && (
            <div className="flex items-center gap-3 p-3 bg-success-50/50 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-success-50 flex items-center justify-center">
                <Banknote size={16} className="text-success-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-surface-400">지원금액 (최대)</p>
                <p className="text-sm font-semibold text-success-700">{budget.toLocaleString()}원</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-primary-50/50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Brain size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-surface-400">심사 방식</p>
              <p className="text-sm font-semibold text-primary-700">AI + 전문가 복합심사</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Feature Notice */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4 sm:p-5 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary-800 mb-1">AI 스마트 심사 적용 사업</h3>
            <p className="text-xs text-primary-600 leading-relaxed">
              본 사업은 BAIKAL Grant AI의 인공지능 심사 시스템이 적용됩니다. 신청서 제출 시 AI가 자동으로 기본 적격성을 검증하고,
              서류 불비 사항을 사전에 안내합니다. 최종 심사는 전문 심사위원단이 수행합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Eligibility */}
      <div className="card-hover mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Target size={16} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-gray-800">지원 자격</h2>
        </div>
        <div className="space-y-2.5">
          {eligibility.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              위 자격요건을 충족하지 않는 경우 AI 적격성 검증 단계에서 자동 반려될 수 있습니다.
              자세한 사항은 사업 공고문을 참조해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* Form preview */}
      {form && form.fields?.length > 0 && (
        <div className="card-hover mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <FileText size={16} className="text-primary-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">신청서 항목</h2>
            <span className="text-xs font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded">{form.fields.length}개</span>
          </div>
          <div className="space-y-2">
            {form.fields.map((f: any, i: number) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-50/80 rounded-xl text-sm">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-gray-700 font-semibold flex-1">{f.label}</span>
                {f.is_required && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-danger-50 text-danger-600 rounded">필수</span>}
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-100 text-surface-500 rounded">{fieldTypeLabel[f.field_type] || f.field_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="card-hover mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <HelpCircle size={16} className="text-blue-600" />
          </div>
          <h2 className="text-base font-bold text-gray-800">자주 묻는 질문</h2>
        </div>
        <div className="divide-y divide-surface-100">
          {faq.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex items-center justify-between w-full py-3.5 text-left group"
              >
                <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors pr-4">
                  Q. {item.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-surface-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="pb-3.5 pl-0.5">
                  <p className="text-sm text-surface-500 leading-relaxed bg-surface-50 rounded-lg p-3">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {isOpen ? (
        user ? (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">지금 바로 신청하세요</h3>
              <p className="text-xs text-surface-500 mt-1">AI가 신청서 작성을 도와드립니다</p>
            </div>
            <Link
              to={`/programs/${id}/apply`}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-primary-600 to-primary-700
                         hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm sm:text-base
                         shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all duration-300 w-full sm:w-auto justify-center"
            >
              <CheckCircle2 size={18} /> 신청하기 <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-5 sm:p-6">
            <h3 className="text-base font-bold text-gray-800 mb-3">로그인 후 신청이 가능합니다</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-primary-600 to-primary-700
                           hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm sm:text-base
                           shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all duration-300"
              >
                로그인 후 신청하기 <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="btn-secondary text-sm sm:text-base px-6 py-3 text-center">
                회원가입
              </Link>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center gap-2 text-surface-400 text-sm bg-surface-50 px-4 py-3 rounded-xl">
          <Shield size={16} /> 이 사업은 접수가 마감되었습니다.
        </div>
      )}
    </div>
  )
}
