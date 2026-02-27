# BAIKAL Grant AI

> 보조금·지원사업 접수 및 관리 시스템 MVP

---

## 시스템 구조

```
baikal-grant-ai/
├── backend/                  # FastAPI (Python)
│   ├── app/
│   │   ├── main.py           # 앱 진입점, CORS, 라우터 등록
│   │   ├── database.py       # SQLAlchemy DB 연결
│   │   ├── models.py         # ORM 모델 (8개 테이블)
│   │   ├── schemas.py        # Pydantic 스키마
│   │   ├── auth.py           # JWT 인증/인가
│   │   ├── routers/
│   │   │   ├── auth.py       # 로그인, 회원가입
│   │   │   ├── programs.py   # 지원사업 CRUD
│   │   │   ├── forms.py      # 폼 빌더 API
│   │   │   ├── applications.py # 신청 접수/제출/상태관리
│   │   │   └── dashboard.py  # 관리자 대시보드 통계
│   │   └── utils/
│   │       ├── storage.py    # MinIO 파일 업로드
│   │       └── pdf.py        # ReportLab PDF 생성
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                 # Vite + React + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── api/client.ts     # Axios API 클라이언트
│   │   ├── store/authStore.ts # Zustand 인증 상태
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx
│   │   │   └── UserLayout.tsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx    # 통계, 차트
│   │   │   │   ├── Programs.tsx     # 사업 CRUD
│   │   │   │   ├── FormBuilder.tsx  # 폼 빌더
│   │   │   │   ├── Applications.tsx # 신청 목록
│   │   │   │   └── ApplicationDetail.tsx # 상태변경, 이력
│   │   │   └── user/
│   │   │       ├── UserLogin.tsx
│   │   │       ├── UserRegister.tsx
│   │   │       ├── ProgramList.tsx  # 사업 목록
│   │   │       ├── ProgramDetail.tsx
│   │   │       ├── ApplyForm.tsx    # 신청서 작성
│   │   │       └── MyApplications.tsx
│   │   └── App.tsx           # 라우팅
│   ├── Dockerfile
│   └── nginx.conf
│
├── database/
│   ├── init.sql              # 테이블 생성 DDL
│   └── seed.sql              # 기본 관리자 계정
│
└── docker-compose.yml        # 전체 서비스 오케스트레이션
```

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Vite + React 18 + TypeScript + TailwindCSS |
| 상태관리 | Zustand |
| 백엔드 | FastAPI (Python 3.9) |
| 데이터베이스 | PostgreSQL 15 |
| 파일 저장소 | MinIO (S3 호환, 폐쇄망 설치 가능) |
| PDF 생성 | ReportLab |
| 인증 | JWT (python-jose) |
| 배포 | Docker Compose |

---

## 빠른 시작

### 1. Docker Compose로 전체 실행

```bash
docker compose up --build
```

### 2. 접속

| 서비스 | URL |
|--------|-----|
| 사용자 포털 | http://localhost:3000 |
| 관리자 포털 | http://localhost:3000/admin |
| API 문서 (Swagger) | http://localhost:8000/docs |
| MinIO 콘솔 | http://localhost:9001 |

### 3. 기본 관리자 계정

```
이메일: admin@baikal.ai
비밀번호: admin1234
```

---

## 개발 환경 실행 (로컬)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> `frontend/vite.config.ts`에서 API 프록시가 `localhost:8000`으로 자동 설정됩니다.

---

## API 설계

### 인증
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 → JWT 반환 |
| GET | /api/auth/me | 내 정보 |

### 지원사업 (관리자)
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/programs/ | 목록 조회 |
| POST | /api/programs/ | 사업 생성 |
| PUT | /api/programs/{id} | 수정 |
| DELETE | /api/programs/{id} | 삭제 |

### 폼 빌더 (관리자)
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/forms/ | 신청서 폼 생성 |
| GET | /api/forms/by-program/{id} | 사업별 폼 조회 |
| POST | /api/forms/{id}/fields | 질문 추가 |
| PUT | /api/forms/{id}/fields/{fid} | 질문 수정 |
| DELETE | /api/forms/{id}/fields/{fid} | 질문 삭제 |
| PUT | /api/forms/{id}/fields/reorder | 순서 변경 |

### 신청 접수
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/applications/ | 신청서 생성(임시저장) |
| POST | /api/applications/{id}/submit | 최종 제출 |
| POST | /api/applications/{id}/files | 파일 업로드 |
| GET | /api/applications/my | 내 신청 목록 |
| GET | /api/applications/{id} | 신청서 상세 |
| GET | /api/applications/{id}/pdf | PDF 다운로드 |

### 관리자 워크플로우
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/applications/admin/all | 전체 신청 목록 |
| PUT | /api/applications/admin/{id}/status | 상태 변경 |

### 대시보드
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/dashboard/summary | 통계 요약 |
| GET | /api/dashboard/recent-applications | 최근 신청 |

---

## 신청 상태 흐름

```
draft → submitted → under_review → approved → completed
                              ↘ revision_requested → submitted
                              ↘ rejected
```

---

## 폐쇄망 설치 고려사항

- MinIO를 S3 대신 사용 → 외부 인터넷 없이 파일 저장소 운영
- 모든 서비스 Docker 이미지로 패키징 → 에어갭(air-gap) 환경 배포 가능
- `docker save`로 이미지 추출 후 폐쇄망 서버에서 `docker load`로 설치

```bash
docker save baikal_backend baikal_frontend baikal_db baikal_minio \
  | gzip > baikal-grant-ai.tar.gz
```

---

## 향후 고도화 로드맵

| 단계 | 기능 |
|------|------|
| v1.1 | 심사위원 포털 + 점수 평가 |
| v1.2 | AI 심사 보조 (서류 요약, 적합성 판단) |
| v1.3 | 부정수급 탐지 |
| v2.0 | 전자결재 연동 (그룹웨어 API) |
