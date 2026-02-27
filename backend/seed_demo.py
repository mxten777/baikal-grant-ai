"""
BAIKAL Grant AI - 시연용 데모 데이터 시드 스크립트
실행: python seed_demo.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import User, Program, Form, FormField, Application, ApplicationAnswer, WorkflowLog
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Helper ──────────────────────────────────────────────────────
def h(pw): return pwd_context.hash(pw)
now = datetime.utcnow()

# ── 1. Users ────────────────────────────────────────────────────
print("👤 사용자 생성 중...")
admin = db.query(User).filter(User.email == "admin@baikal.ai").first()
if not admin:
    admin = User(email="admin@baikal.ai", password_hash=h("admin1234"),
                 full_name="BAIKAL 관리자", role="admin", created_at=now)
    db.add(admin)
    db.flush()

reviewer = db.query(User).filter(User.email == "reviewer@baikal.ai").first()
if not reviewer:
    reviewer = User(email="reviewer@baikal.ai", password_hash=h("review1234"),
                    full_name="김심사", role="reviewer", created_at=now)
    db.add(reviewer)
    db.flush()

demo_users = [
    ("hong@startup.kr", "홍길동", "테스트1234"),
    ("kim@techlab.co.kr", "김혁신", "테스트1234"),
    ("lee@greenworld.kr", "이지구", "테스트1234"),
    ("park@aimedical.kr", "박메디", "테스트1234"),
    ("choi@smartfarm.kr", "최농업", "테스트1234"),
    ("jung@culture.kr", "정문화", "테스트1234"),
]
users = []
for email, name, pw in demo_users:
    u = db.query(User).filter(User.email == email).first()
    if not u:
        u = User(email=email, password_hash=h(pw), full_name=name, role="user",
                 created_at=now - timedelta(days=30))
        db.add(u)
        db.flush()
    users.append(u)
db.commit()
print(f"  ✅ 관리자 1명 + 심사위원 1명 + 일반 사용자 {len(users)}명")

# ── 2. Programs ────────────────────────────────────────────────
print("📋 지원사업 생성 중...")
programs_data = [
    {
        "title": "2026 AI 스타트업 혁신 지원사업",
        "description": "인공지능 기반 혁신 스타트업의 초기 성장을 지원합니다. 기술 개발부터 시장 진출까지 종합적인 지원 패키지를 제공하며, AI 기술의 사회적 활용도가 높은 프로젝트를 우선 선정합니다. 최대 1억원의 사업비와 멘토링, 투자 연계 등 다양한 비금전적 혜택도 포함됩니다.",
        "start_date": "2026-03-01",
        "end_date": "2026-12-31",
        "apply_start_date": "2026-02-01",
        "apply_end_date": "2026-04-30",
        "budget_amount": 100000000,
        "status": "active",
    },
    {
        "title": "2026 친환경 그린뉴딜 보조금",
        "description": "탄소 중립 달성을 위한 친환경 기술 및 비즈니스 모델 개발을 지원합니다. 재생에너지, 순환경제, 친환경 소재 개발 등 녹색 전환에 기여하는 프로젝트를 대상으로 합니다. ESG 경영 실천 기업 우대, 최대 5천만원 지원.",
        "start_date": "2026-04-01",
        "end_date": "2027-03-31",
        "apply_start_date": "2026-02-15",
        "apply_end_date": "2026-05-15",
        "budget_amount": 50000000,
        "status": "active",
    },
    {
        "title": "2026 디지털 헬스케어 R&D 지원",
        "description": "디지털 헬스케어 분야의 혁신 기술 개발을 위한 R&D 보조금입니다. 원격의료, AI 진단, 바이오 센서, 디지털 치료제 등 첨단 의료 기술 연구개발을 지원합니다. 식약처 인허가 준비 비용도 지원 범위에 포함됩니다.",
        "start_date": "2026-05-01",
        "end_date": "2027-04-30",
        "apply_start_date": "2026-03-01",
        "apply_end_date": "2026-06-30",
        "budget_amount": 200000000,
        "status": "active",
    },
    {
        "title": "2025 스마트팜 혁신 보조금 (2차)",
        "description": "농업의 디지털 전환을 위한 스마트팜 기술 도입 및 확산을 지원합니다. IoT 센서, 자동화 시스템, 데이터 기반 농업 경영 등 첨단 농업기술 적용 프로젝트가 대상입니다.",
        "start_date": "2025-07-01",
        "end_date": "2026-06-30",
        "apply_start_date": "2025-05-01",
        "apply_end_date": "2025-07-31",
        "budget_amount": 30000000,
        "status": "closed",
    },
    {
        "title": "2025 문화콘텐츠 창작 지원금",
        "description": "K-콘텐츠의 글로벌 경쟁력 강화를 위한 창작 지원 프로그램입니다. 웹툰, 웹소설, 인디게임, 메타버스 콘텐츠 등 디지털 문화콘텐츠 제작을 지원합니다. 1인 창작자도 신청 가능합니다.",
        "start_date": "2025-09-01",
        "end_date": "2026-08-31",
        "apply_start_date": "2025-07-01",
        "apply_end_date": "2025-09-30",
        "budget_amount": 20000000,
        "status": "closed",
    },
]

programs = []
for pd in programs_data:
    existing = db.query(Program).filter(Program.title == pd["title"]).first()
    if existing:
        programs.append(existing)
        continue
    p = Program(
        title=pd["title"],
        description=pd["description"],
        start_date=datetime.strptime(pd["start_date"], "%Y-%m-%d"),
        end_date=datetime.strptime(pd["end_date"], "%Y-%m-%d"),
        apply_start_date=datetime.strptime(pd["apply_start_date"], "%Y-%m-%d"),
        apply_end_date=datetime.strptime(pd["apply_end_date"], "%Y-%m-%d"),
        budget_amount=pd["budget_amount"],
        status=pd["status"],
        created_by=admin.id,
        created_at=now - timedelta(days=60),
    )
    db.add(p)
    db.flush()
    programs.append(p)
db.commit()
print(f"  ✅ 지원사업 {len(programs)}개")

# ── 3. Forms & Fields ──────────────────────────────────────────
print("📝 신청서 양식 생성 중...")
form_templates = {
    0: [  # AI 스타트업
        ("text", "기업명/단체명", "org_name", "법인명 또는 단체명을 입력하세요", True),
        ("text", "대표자명", "ceo_name", "대표이사 또는 대표자 이름", True),
        ("text", "사업자등록번호", "biz_number", "000-00-00000 형식으로 입력", True),
        ("select", "기업 유형", "company_type", "해당하는 유형을 선택하세요", True,
         [{"label": "예비창업자", "value": "0"}, {"label": "1~3년 스타트업", "value": "1"},
          {"label": "3~7년 스케일업", "value": "2"}, {"label": "사회적기업", "value": "3"}]),
        ("text", "핵심 AI 기술 분야", "ai_field", "주요 AI 기술 (예: NLP, 컴퓨터 비전, 강화학습 등)", True),
        ("text", "프로젝트명", "project_name", "지원 프로젝트의 명칭", True),
        ("number", "신청 금액 (원)", "request_amount", "최대 100,000,000원", True),
        ("text", "프로젝트 요약", "project_summary", "프로젝트의 핵심 내용을 200자 이내로 요약", True),
        ("date", "사업 시작 예정일", "planned_start", "", True),
        ("file", "사업계획서 첨부", "biz_plan", "PDF 또는 DOCX 파일로 첨부", True),
        ("file", "재무제표 첨부", "financial_stmt", "최근 2개년 재무제표", False),
        ("agreement", "개인정보 수집·이용 동의", "privacy_agree", "본인은 BAIKAL Grant AI의 개인정보 수집·이용·제공에 동의합니다. 수집된 정보는 보조금 심사 및 관리 목적으로만 사용됩니다.", True),
    ],
    1: [  # 그린뉴딜
        ("text", "기업명/단체명", "org_name", "법인명 또는 단체명", True),
        ("text", "대표자명", "ceo_name", "대표이사 이름", True),
        ("text", "사업자등록번호", "biz_number", "", True),
        ("select", "사업 분야", "green_field", "", True,
         [{"label": "재생에너지", "value": "0"}, {"label": "순환경제", "value": "1"},
          {"label": "친환경 소재", "value": "2"}, {"label": "탄소저감 기술", "value": "3"}, {"label": "기타", "value": "4"}]),
        ("text", "프로젝트명", "project_name", "프로젝트 명칭", True),
        ("number", "예상 탄소 감축량 (tCO₂)", "carbon_reduction", "연간 예상 감축량", False),
        ("number", "신청 금액 (원)", "request_amount", "최대 50,000,000원", True),
        ("checkbox", "ESG 인증 보유 현황", "esg_cert", "", False,
         [{"label": "ISO14001", "value": "0"}, {"label": "K-ESG", "value": "1"},
          {"label": "RE100", "value": "2"}, {"label": "없음", "value": "3"}]),
        ("file", "사업계획서", "biz_plan", "PDF 파일로 첨부", True),
        ("agreement", "개인정보 수집·이용 동의", "privacy_agree", "본 신청과 관련하여 개인정보 수집 및 이용에 동의합니다.", True),
    ],
    2: [  # 디지털 헬스케어
        ("text", "기관명", "org_name", "병원, 기업, 연구소 등", True),
        ("text", "연구 책임자", "researcher", "연구 책임자 이름 및 직위", True),
        ("select", "연구 분야", "health_field", "", True,
         [{"label": "원격의료", "value": "0"}, {"label": "AI 진단", "value": "1"},
          {"label": "디지털 치료제", "value": "2"}, {"label": "바이오 센서", "value": "3"},
          {"label": "의료 데이터", "value": "4"}]),
        ("text", "연구 과제명", "project_name", "", True),
        ("number", "신청 금액 (원)", "request_amount", "최대 200,000,000원", True),
        ("text", "연구 목표 및 기대효과", "research_goal", "핵심 연구 목표를 기술", True),
        ("text", "기존 연구 실적", "prior_research", "관련 분야 논문, 특허 등", False),
        ("file", "연구계획서", "research_plan", "상세 연구계획서 첨부", True),
        ("agreement", "개인정보 수집 동의", "privacy_agree", "연구비 관리를 위한 개인정보 수집에 동의합니다.", True),
    ],
    3: [  # 스마트팜
        ("text", "농장명/법인명", "farm_name", "", True),
        ("text", "대표자명", "owner_name", "", True),
        ("text", "농장 소재지", "farm_location", "시/군/구까지 입력", True),
        ("number", "농장 면적 (평)", "farm_area", "", True),
        ("select", "작물 유형", "crop_type", "", True,
         [{"label": "과일류", "value": "0"}, {"label": "채소류", "value": "1"},
          {"label": "화훼류", "value": "2"}, {"label": "특용작물", "value": "3"}]),
        ("number", "신청 금액 (원)", "request_amount", "최대 30,000,000원", True),
        ("file", "사업계획서", "biz_plan", "", True),
        ("agreement", "개인정보 수집 동의", "privacy_agree", "본인은 개인정보 수집에 동의합니다.", True),
    ],
    4: [  # 문화콘텐츠
        ("text", "창작자명/팀명", "creator_name", "", True),
        ("select", "콘텐츠 유형", "content_type", "", True,
         [{"label": "웹툰", "value": "0"}, {"label": "웹소설", "value": "1"},
          {"label": "인디게임", "value": "2"}, {"label": "메타버스", "value": "3"},
          {"label": "기타", "value": "4"}]),
        ("text", "작품 제목", "work_title", "", True),
        ("text", "작품 기획 의도", "work_concept", "200자 이내", True),
        ("number", "신청 금액 (원)", "request_amount", "최대 20,000,000원", True),
        ("file", "포트폴리오", "portfolio", "작품 샘플 첨부", True),
        ("agreement", "개인정보 수집 동의", "privacy_agree", "개인정보 수집·이용에 동의합니다.", True),
    ],
}

forms = []
for idx, prog in enumerate(programs):
    existing_form = db.query(Form).filter(Form.program_id == prog.id).first()
    if existing_form:
        forms.append(existing_form)
        continue
    f = Form(program_id=prog.id, title=f"{prog.title} 신청서",
             description="", is_active=True, created_at=now - timedelta(days=50))
    db.add(f)
    db.flush()

    template = form_templates.get(idx, form_templates[0])
    for order, field_data in enumerate(template):
        ft, label, name, desc, req = field_data[:5]
        opts = field_data[5] if len(field_data) > 5 else None
        ff = FormField(form_id=f.id, field_type=ft, label=label, name=name,
                       description=desc, is_required=req, options=opts,
                       app_order=order, created_at=now - timedelta(days=50))
        db.add(ff)
    db.flush()
    forms.append(f)
db.commit()
print(f"  ✅ 신청서 양식 {len(forms)}개 (총 필드 {sum(len(form_templates.get(i, [])) for i in range(len(programs)))}개)")

# ── 4. Applications ────────────────────────────────────────────
print("📄 신청서 데이터 생성 중...")
app_counter = 0

# AI 스타트업 (프로그램 0) - 다양한 상태
ai_apps = [
    (users[0], "submitted", 15, {"org_name": "(주)스마트브레인", "ceo_name": "홍길동", "biz_number": "123-45-67890", "company_type": "1", "ai_field": "자연어처리(NLP)", "project_name": "한국어 특화 LLM 개발", "request_amount": "80000000", "project_summary": "한국어 맥락을 정확히 이해하는 경량 LLM 모델 개발 및 SaaS 서비스화", "planned_start": "2026-04-01"}),
    (users[1], "under_review", 12, {"org_name": "(주)테크랩코리아", "ceo_name": "김혁신", "biz_number": "234-56-78901", "company_type": "2", "ai_field": "컴퓨터 비전", "project_name": "제조업 불량검출 AI 솔루션", "request_amount": "100000000", "project_summary": "딥러닝 기반 실시간 제조 공정 불량 자동 검출 시스템 개발", "planned_start": "2026-05-01"}),
    (users[3], "approved", 20, {"org_name": "(주)AI메디컬", "ceo_name": "박메디", "biz_number": "345-67-89012", "company_type": "1", "ai_field": "의료 AI", "project_name": "X-ray 자동 판독 AI", "request_amount": "95000000", "project_summary": "흉부 X-ray 영상에서 14종 질환을 자동 검출하는 AI 모델 개발", "planned_start": "2026-03-15"}),
    (users[4], "revision_requested", 8, {"org_name": "(주)스마트팜테크", "ceo_name": "최농업", "biz_number": "456-78-90123", "company_type": "0", "ai_field": "IoT + AI", "project_name": "AI 기반 작물 생육 예측", "request_amount": "60000000", "project_summary": "센서 데이터와 AI 분석을 결합한 작물 최적 생육 조건 예측 시스템", "planned_start": "2026-06-01"}),
    (users[5], "rejected", 18, {"org_name": "개인(정문화)", "ceo_name": "정문화", "biz_number": "567-89-01234", "company_type": "3", "ai_field": "생성형 AI", "project_name": "AI 아트 저작 도구", "request_amount": "40000000", "project_summary": "생성형 AI를 활용한 디지털 아트 창작 플랫폼 개발", "planned_start": "2026-04-15"}),
]

# 그린뉴딜 (프로그램 1)
green_apps = [
    (users[2], "submitted", 10, {"org_name": "(주)그린월드", "ceo_name": "이지구", "biz_number": "678-90-12345", "green_field": "1", "project_name": "바이오 플라스틱 재활용 시스템", "carbon_reduction": "500", "request_amount": "45000000", "esg_cert": "0,1"}),
    (users[1], "approved", 22, {"org_name": "(주)테크랩코리아", "ceo_name": "김혁신", "biz_number": "234-56-78901", "green_field": "3", "project_name": "산업 폐열 회수 AI 최적화", "carbon_reduction": "1200", "request_amount": "50000000", "esg_cert": "0"}),
    (users[0], "under_review", 7, {"org_name": "(주)스마트브레인", "ceo_name": "홍길동", "biz_number": "123-45-67890", "green_field": "0", "project_name": "AI 태양광 발전효율 최적화", "carbon_reduction": "800", "request_amount": "35000000", "esg_cert": "3"}),
]

# 디지털 헬스케어 (프로그램 2)
health_apps = [
    (users[3], "submitted", 5, {"org_name": "(주)AI메디컬", "researcher": "박메디 대표이사", "health_field": "1", "project_name": "AI 기반 피부암 조기진단 플랫폼", "request_amount": "180000000", "research_goal": "스마트폰 카메라를 활용한 피부 병변 AI 분석 및 조기 진단 시스템 개발", "prior_research": "SCI 논문 12편, 국내특허 3건"}),
    (users[1], "submitted", 3, {"org_name": "(주)테크랩코리아 의료사업부", "researcher": "김혁신 CTO", "health_field": "4", "project_name": "의료 데이터 연합학습 플랫폼", "request_amount": "150000000", "research_goal": "병원 간 의료 데이터를 안전하게 공유·학습하는 Federated Learning 플랫폼 구축", "prior_research": "관련 논문 5편, SW 특허 2건"}),
]

# 스마트팜 (프로그램 3) - closed
farm_apps = [
    (users[4], "completed", 90, {"farm_name": "최첨단농장", "owner_name": "최농업", "farm_location": "경기도 이천시", "farm_area": "3000", "crop_type": "0", "request_amount": "28000000"}),
    (users[0], "approved", 85, {"farm_name": "스마트베리팜", "owner_name": "홍길동", "farm_location": "충남 논산시", "farm_area": "2000", "crop_type": "0", "request_amount": "25000000"}),
]

# 문화콘텐츠 (프로그램 4) - closed
culture_apps = [
    (users[5], "completed", 80, {"creator_name": "정문화 작가", "content_type": "0", "work_title": "AI와 인간의 공존", "work_concept": "AI 시대에 인간 고유의 가치를 탐구하는 SF 웹툰", "request_amount": "18000000"}),
    (users[2], "approved", 75, {"creator_name": "그린스토리 팀", "content_type": "2", "work_title": "에코히어로", "work_concept": "환경 보호를 주제로 한 교육용 인디게임", "request_amount": "15000000"}),
]

all_apps_data = [
    (programs[0], ai_apps),
    (programs[1], green_apps),
    (programs[2], health_apps),
    (programs[3], farm_apps),
    (programs[4], culture_apps),
]

for prog, app_list in all_apps_data:
    form = db.query(Form).filter(Form.program_id == prog.id).first()
    if not form:
        continue
    fields = db.query(FormField).filter(FormField.form_id == form.id).order_by(FormField.app_order).all()

    for user, status, days_ago, answer_data in app_list:
        app_counter += 1
        app_num = f"BKAI-2026-{app_counter:04d}"

        existing = db.query(Application).filter(Application.application_number == app_num).first()
        if existing:
            continue

        sub_date = now - timedelta(days=days_ago) if status != "draft" else None
        app = Application(
            program_id=prog.id,
            user_id=user.id,
            status=status,
            submission_date=sub_date,
            application_number=app_num,
            updated_at=now - timedelta(days=max(0, days_ago - 2)),
        )
        db.add(app)
        db.flush()

        # Answers
        for field in fields:
            val = answer_data.get(field.name, "")
            if val:
                ans = ApplicationAnswer(
                    application_id=app.id,
                    field_id=field.id,
                    value=str(val),
                    created_at=now - timedelta(days=days_ago),
                )
                db.add(ans)

        # Workflow logs
        if status == "submitted":
            db.add(WorkflowLog(application_id=app.id, actor_id=user.id, action="submit",
                               previous_status="draft", new_status="submitted",
                               comments="신청서 제출", created_at=now - timedelta(days=days_ago)))
        elif status == "under_review":
            db.add(WorkflowLog(application_id=app.id, actor_id=user.id, action="submit",
                               previous_status="draft", new_status="submitted",
                               comments="신청서 제출", created_at=now - timedelta(days=days_ago)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="review",
                               previous_status="submitted", new_status="under_review",
                               comments="서류 검토 시작", created_at=now - timedelta(days=days_ago - 2)))
        elif status == "approved":
            db.add(WorkflowLog(application_id=app.id, actor_id=user.id, action="submit",
                               previous_status="draft", new_status="submitted",
                               comments="신청서 제출", created_at=now - timedelta(days=days_ago)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="review",
                               previous_status="submitted", new_status="under_review",
                               comments="1차 서류 심사 통과", created_at=now - timedelta(days=days_ago - 3)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="approve",
                               previous_status="under_review", new_status="approved",
                               comments="최종 선정 승인. 우수한 기술력과 사업 계획 확인.", created_at=now - timedelta(days=days_ago - 7)))
        elif status == "revision_requested":
            db.add(WorkflowLog(application_id=app.id, actor_id=user.id, action="submit",
                               previous_status="draft", new_status="submitted",
                               comments="신청서 제출", created_at=now - timedelta(days=days_ago)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="review",
                               previous_status="submitted", new_status="under_review",
                               comments="검토 시작", created_at=now - timedelta(days=days_ago - 1)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="revision",
                               previous_status="under_review", new_status="revision_requested",
                               comments="사업계획서 보완 필요. 시장 분석 및 경쟁사 대비 차별성을 보강해주세요.", created_at=now - timedelta(days=days_ago - 3)))
        elif status == "rejected":
            db.add(WorkflowLog(application_id=app.id, actor_id=user.id, action="submit",
                               previous_status="draft", new_status="submitted",
                               comments="신청서 제출", created_at=now - timedelta(days=days_ago)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="review",
                               previous_status="submitted", new_status="under_review",
                               comments="서류 검토 시작", created_at=now - timedelta(days=days_ago - 2)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="reject",
                               previous_status="under_review", new_status="rejected",
                               comments="사업 분야 적합성 미달. AI 기술 활용 비중이 기준 미달입니다.", created_at=now - timedelta(days=days_ago - 5)))
        elif status == "completed":
            db.add(WorkflowLog(application_id=app.id, actor_id=user.id, action="submit",
                               previous_status="draft", new_status="submitted",
                               comments="신청서 제출", created_at=now - timedelta(days=days_ago)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="approve",
                               previous_status="submitted", new_status="approved",
                               comments="선정 승인", created_at=now - timedelta(days=days_ago - 10)))
            db.add(WorkflowLog(application_id=app.id, actor_id=admin.id, action="complete",
                               previous_status="approved", new_status="completed",
                               comments="정산 완료. 최종 보고서 확인 및 정산 승인.", created_at=now - timedelta(days=5)))

db.commit()
print(f"  ✅ 신청서 {app_counter}개 (다양한 상태 포함)")

# ── Summary ─────────────────────────────────────────────────────
print()
print("═" * 50)
print("🎉 시연용 데모 데이터 생성 완료!")
print("═" * 50)
print()
print("📌 계정 정보:")
print(f"  관리자: admin@baikal.ai / admin1234")
print(f"  심사위원: reviewer@baikal.ai / review1234")
for email, name, pw in demo_users:
    print(f"  사용자: {email} / {pw} ({name})")
print()
print(f"📌 지원사업: {len(programs)}개 (진행중 {sum(1 for p in programs if p.status == 'active')}개, 마감 {sum(1 for p in programs if p.status == 'closed')}개)")
print(f"📌 신청서: {app_counter}개")
print(f"📌 신청서 양식: {len(forms)}개")
print()
print("🚀 http://localhost:5173 에서 확인하세요!")

db.close()
