import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db
from app.utils.storage import upload_file
from app.utils.pdf import generate_application_pdf

router = APIRouter()

STATUS_FLOW = ["draft", "submitted", "under_review", "revision_requested", "approved", "rejected", "completed"]


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
    application.submission_date = datetime.utcnow()

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

    file_path = await upload_file(file, f"applications/{app_id}")

    app_file = models.ApplicationFile(
        application_id=app_id,
        field_id=field_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=0,
    )
    db.add(app_file)
    db.commit()
    db.refresh(app_file)
    return {"file_id": app_file.id, "file_path": file_path}


# ─── User: My applications ────────────────────────────────────
@router.get("/my", response_model=List[schemas.ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Application).filter(
        models.Application.user_id == current_user.id
    ).order_by(models.Application.updated_at.desc()).all()


# ─── Admin: List all applications ─────────────────────────────
@router.get("/admin/all", response_model=List[schemas.ApplicationOut])
def list_all_applications(
    program_id: int = None,
    status: str = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    query = db.query(models.Application)
    if program_id:
        query = query.filter(models.Application.program_id == program_id)
    if status:
        query = query.filter(models.Application.status == status)
    return query.order_by(models.Application.updated_at.desc()).all()


# ─── Admin: Update status ─────────────────────────────────────
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

    prev_status = application.status
    application.status = status_in.status

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
