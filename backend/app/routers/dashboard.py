from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, cast, Float
from datetime import datetime, timedelta
from app import models
from app.auth import require_admin
from app.database import get_db

router = APIRouter()


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    total = db.query(func.count(models.Application.id)).scalar()

    status_counts = (
        db.query(models.Application.status, func.count(models.Application.id))
        .group_by(models.Application.status)
        .all()
    )

    total_programs = db.query(func.count(models.Program.id)).scalar()
    active_programs = db.query(func.count(models.Program.id)).filter(
        models.Program.status == "active"
    ).scalar()

    total_users = db.query(func.count(models.User.id)).filter(
        models.User.role == "user"
    ).scalar()

    total_budget = db.query(func.sum(models.Program.budget_amount)).scalar() or 0

    approved_budget = (
        db.query(func.sum(models.Program.budget_amount))
        .join(models.Application, models.Application.program_id == models.Program.id)
        .filter(models.Application.status.in_(["approved", "completed"]))
        .scalar()
    ) or 0

    by_status = {row[0]: row[1] for row in status_counts}
    approved_count = by_status.get("approved", 0) + by_status.get("completed", 0)
    approval_rate = round((approved_count / total * 100), 1) if total > 0 else 0

    return {
        "total_applications": total,
        "total_programs": total_programs,
        "active_programs": active_programs,
        "by_status": by_status,
        "total_users": total_users,
        "total_budget": float(total_budget),
        "approved_budget": float(approved_budget),
        "approval_rate": approval_rate,
    }


@router.get("/recent-applications")
def get_recent_applications(
    limit: int = 10,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    apps = (
        db.query(models.Application)
        .order_by(models.Application.updated_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for a in apps:
        user = db.query(models.User).filter(models.User.id == a.user_id).first()
        program = db.query(models.Program).filter(models.Program.id == a.program_id).first()
        result.append({
            "id": a.id,
            "application_number": a.application_number,
            "program_id": a.program_id,
            "program_title": program.title if program else "",
            "user_id": a.user_id,
            "user_name": user.full_name if user else "",
            "status": a.status,
            "submission_date": a.submission_date,
            "updated_at": a.updated_at,
        })
    return result


@router.get("/program-stats")
def get_program_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """각 프로그램별 신청 통계"""
    programs = db.query(models.Program).all()
    result = []
    for p in programs:
        app_count = db.query(func.count(models.Application.id)).filter(
            models.Application.program_id == p.id
        ).scalar()
        approved = db.query(func.count(models.Application.id)).filter(
            models.Application.program_id == p.id,
            models.Application.status.in_(["approved", "completed"]),
        ).scalar()
        result.append({
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "budget_amount": float(p.budget_amount) if p.budget_amount else 0,
            "application_count": app_count,
            "approved_count": approved,
        })
    return result


@router.get("/activity-logs")
def get_activity_logs(
    limit: int = 15,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """최근 활동 로그 (워크플로우 이력)"""
    logs = (
        db.query(models.WorkflowLog)
        .order_by(models.WorkflowLog.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for log in logs:
        actor = db.query(models.User).filter(models.User.id == log.actor_id).first()
        app = db.query(models.Application).filter(models.Application.id == log.application_id).first()
        result.append({
            "id": log.id,
            "application_number": app.application_number if app else "",
            "actor_name": actor.full_name if actor else "",
            "action": log.action,
            "previous_status": log.previous_status,
            "new_status": log.new_status,
            "comments": log.comments,
            "created_at": log.created_at,
        })
    return result
