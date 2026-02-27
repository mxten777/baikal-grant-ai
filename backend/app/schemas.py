from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth ─────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "user"


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
