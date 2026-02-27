from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, cast, Float
from typing import Optional
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
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """최근 신청서 — joinedload로 N+1 해결"""
    apps = (
        db.query(models.Application)
        .options(
            joinedload(models.Application.user),
            joinedload(models.Application.program),
        )
        .order_by(models.Application.updated_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": a.id,
            "application_number": a.application_number,
            "program_id": a.program_id,
            "program_title": a.program.title if a.program else "",
            "user_id": a.user_id,
            "user_name": a.user.full_name if a.user else "",
            "status": a.status,
            "submission_date": a.submission_date,
            "updated_at": a.updated_at,
        }
        for a in apps
    ]


@router.get("/program-stats")
def get_program_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """각 프로그램별 신청 통계 — 서브쿼리로 N+1 해결"""
    app_counts = (
        db.query(
            models.Application.program_id,
            func.count(models.Application.id).label("app_count"),
            func.sum(
                case(
                    (models.Application.status.in_(["approved", "completed"]), 1),
                    else_=0,
                )
            ).label("approved_count"),
        )
        .group_by(models.Application.program_id)
        .subquery()
    )

    programs = (
        db.query(models.Program, app_counts.c.app_count, app_counts.c.approved_count)
        .outerjoin(app_counts, models.Program.id == app_counts.c.program_id)
        .all()
    )

    return [
        {
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "budget_amount": float(p.budget_amount) if p.budget_amount else 0,
            "application_count": cnt or 0,
            "approved_count": approved or 0,
        }
        for p, cnt, approved in programs
    ]


@router.get("/activity-logs")
def get_activity_logs(
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """최근 활동 로그 — joinedload로 N+1 해결"""
    logs = (
        db.query(models.WorkflowLog)
        .options(
            joinedload(models.WorkflowLog.application),
            joinedload(models.WorkflowLog.actor),
        )
        .order_by(models.WorkflowLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": log.id,
            "application_number": log.application.application_number if log.application else "",
            "actor_name": log.actor.full_name if log.actor else "",
            "action": log.action,
            "previous_status": log.previous_status,
            "new_status": log.new_status,
            "comments": log.comments,
            "created_at": log.created_at,
        }
        for log in logs
    ]
