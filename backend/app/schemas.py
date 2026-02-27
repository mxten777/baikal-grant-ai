from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth ─────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str  # 검증은 auth router에서 수행
    full_name: str
    # role 필드 제거 — 회원가입 시 항상 'user'로 고정

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 50:
            raise ValueError('이름은 1~50자 이내여야 합니다')
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Program ──────────────────────────────────────
class ProgramCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    apply_start_date: Optional[datetime] = None
    apply_end_date: Optional[datetime] = None
    budget_amount: Optional[float] = None
    status: Optional[str] = "draft"
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 200:
            raise ValueError('사업명은 2~200자 이내여야 합니다')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ('draft', 'active', 'closed'):
            raise ValueError('상태는 draft, active, closed 중 하나여야 합니다')
        return v

class ProgramUpdate(ProgramCreate):
    pass


class ProgramOut(ProgramCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# ─── Form Fields ──────────────────────────────────
class FormFieldCreate(BaseModel):
    field_type: str
    label: str
    name: str
    description: Optional[str] = None
    options: Optional[List[Any]] = None
    is_required: Optional[bool] = False
    app_order: Optional[int] = 0


class FormFieldOut(FormFieldCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    form_id: int


# ─── Form ─────────────────────────────────────────
class FormCreate(BaseModel):
    program_id: int
    title: str
    description: Optional[str] = None


class FormOut(FormCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    fields: List[FormFieldOut] = []
    created_at: datetime


# ─── Application ──────────────────────────────────
class AnswerCreate(BaseModel):
    field_id: int
    value: Optional[str] = None
    value_json: Optional[Any] = None


class ApplicationCreate(BaseModel):
    program_id: int
    answers: List[AnswerCreate] = []


class StatusUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {'submitted', 'under_review', 'revision_requested', 'approved', 'rejected', 'completed'}
        if v not in allowed:
            raise ValueError(f'유효하지 않은 상태입니다: {v}')
        return v


class ApplicationFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime


class WorkflowLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime
    actor: Optional[UserOut] = None


class ApplicationAnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    field_id: int
    value: Optional[str] = None
    value_json: Optional[Any] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    program_id: int
    user_id: int
    status: str
    submission_date: Optional[datetime] = None
    updated_at: datetime
    application_number: Optional[str] = None
    answers: List[ApplicationAnswerOut] = []
    files: List[ApplicationFileOut] = []
    logs: List[WorkflowLogOut] = []
