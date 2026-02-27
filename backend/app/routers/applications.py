import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db
from app.utils.storage import upload_file
from app.utils.pdf import generate_application_pdf

router = APIRouter()

VALID_STATUSES = {"draft", "submitted", "under_review", "revision_requested", "approved", "rejected", "completed"}

# ─── 상태 전이 규칙 (Critical #6) ────────────────────────────
ALLOWED_TRANSITIONS = {
    "submitted": {"under_review", "revision_requested", "rejected"},
    "under_review": {"approved", "rejected", "revision_requested"},
    "revision_requested": {"submitted"},  # 사용자 재제출 시
    "approved": {"completed"},
    # rejected, completed, draft → 전이 불가 (관리자)
}

# ─── 파일 업로드 제한 (Critical #4) ──────────────────────────
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".hwp", ".hwpx", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
                      ".jpg", ".jpeg", ".png", ".gif", ".zip", ".csv"}
ALLOWED_MIMETYPES = {
    "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/haansofthwp", "application/x-hwp", "application/octet-stream",
    "image/jpeg", "image/png", "image/gif",
    "application/zip", "text/csv",
}


def generate_app_number(program_id: int, app_id: int) -> str:
    now = datetime.now().strftime("%Y%m%d")
    return f"APP-{program_id:04d}-{now}-{app_id:04d}"


# ─── User: Create draft ────────────────────────────────────────
@router.post("/", response_model=schemas.ApplicationOut)
def create_application(
    app_in: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = models.Application(
        program_id=app_in.program_id,
        user_id=current_user.id,
        status="draft",
    )
    db.add(application)
    db.flush()  # Get ID before commit

    # Set application number
    application.application_number = generate_app_number(app_in.program_id, application.id)

    # Save answers
    for answer in app_in.answers:
        ans = models.ApplicationAnswer(
            application_id=application.id,
            field_id=answer.field_id,
            value=answer.value,
            value_json=answer.value_json,
        )
        db.add(ans)

    db.commit()
    db.refresh(application)
    return application


# ─── User: Submit application ─────────────────────────────────
@router.post("/{app_id}/submit", response_model=schemas.ApplicationOut)
def submit_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.status != "draft":
        raise HTTPException(status_code=400, detail="Application already submitted")

    prev_status = application.status
    application.status = "submitted"
    application.submission_date = datetime.now(timezone.utc)

    log = models.WorkflowLog(
        application_id=application.id,
        actor_id=current_user.id,
        action="submit",
        previous_status=prev_status,
        new_status="submitted",
        comments="User submitted application",
    )
    db.add(log)
    db.commit()
    db.refresh(application)
    return application


# ─── User: Upload file ────────────────────────────────────────
@router.post("/{app_id}/files")
async def upload_application_file(
    app_id: int,
    field_id: int = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # ─── 파일 검증 (Critical #4) ───
    # 확장자 검증
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"허용되지 않는 파일 형식입니다: {ext}. 허용: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    # MIME 타입 검증
    if file.content_type and file.content_type not in ALLOWED_MIMETYPES:
        raise HTTPException(status_code=400, detail=f"허용되지 않는 파일 타입입니다: {file.content_type}")

    # 파일 크기 검증 (읽기 전 size 헤더 확인)
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"파일 크기가 {MAX_FILE_SIZE // (1024*1024)}MB를 초과합니다")
    if file_size == 0:
        raise HTTPException(status_code=400, detail="빈 파일은 업로드할 수 없습니다")

    # 파일 포인터 리셋 후 업로드
    await file.seek(0)
    file_path = await upload_file(file, f"applications/{app_id}")

    app_file = models.ApplicationFile(
        application_id=app_id,
        field_id=field_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file_size,
    )
    db.add(app_file)
    db.commit()
    db.refresh(app_file)
    return {"file_id": app_file.id, "file_path": file_path, "file_size": file_size}


# ─── User: My applications (with pagination) ─────────────────
@router.get("/my", response_model=List[schemas.ApplicationOut])
def my_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Application).filter(
        models.Application.user_id == current_user.id
    ).order_by(models.Application.updated_at.desc()).offset(skip).limit(limit).all()


# ─── Admin: List all applications (with pagination + validation) ─
@router.get("/admin/all", response_model=List[schemas.ApplicationOut])
def list_all_applications(
    program_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    query = db.query(models.Application)
    if program_id:
        query = query.filter(models.Application.program_id == program_id)
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"유효하지 않은 상태: {status}")
        query = query.filter(models.Application.status == status)
    return query.order_by(models.Application.updated_at.desc()).offset(skip).limit(limit).all()


# ─── Admin: Update status (with transition validation) ────────
@router.put("/admin/{app_id}/status", response_model=schemas.ApplicationOut)
def update_status(
    app_id: int,
    status_in: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # ─── 상태 전이 검증 (Critical #6) ───
    current_status = application.status
    new_status = status_in.status
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"'{current_status}' → '{new_status}' 전이가 허용되지 않습니다. 허용: {sorted(allowed) if allowed else '없음'}"
        )

    prev_status = application.status
    application.status = new_status

    log = models.WorkflowLog(
        application_id=application.id,
        actor_id=admin.id,
        action="status_change",
        previous_status=prev_status,
        new_status=status_in.status,
        comments=status_in.comments,
    )
    db.add(log)
    db.commit()
    db.refresh(application)
    return application


# ─── Get single application ───────────────────────────────────
@router.get("/{app_id}", response_model=schemas.ApplicationOut)
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Users can only see their own; admins see all
    if current_user.role != "admin" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return application


# ─── PDF Download ─────────────────────────────────────────────
@router.get("/{app_id}/pdf")
def download_pdf(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role != "admin" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    from fastapi.responses import StreamingResponse
    import io
    pdf_bytes = generate_application_pdf(application)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=application_{app_id}.pdf"}
    )
