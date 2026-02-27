from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.ProgramOut])
def list_programs(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Public: List programs with optional filter & pagination"""
    query = db.query(models.Program)
    if status:
        query = query.filter(models.Program.status == status)
    return query.order_by(models.Program.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.ProgramOut)
def create_program(
    program_in: schemas.ProgramCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    program = models.Program(**program_in.model_dump(), created_by=admin.id)
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.get("/{program_id}", response_model=schemas.ProgramOut)
def get_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.put("/{program_id}", response_model=schemas.ProgramOut)
def update_program(
    program_id: int,
    program_in: schemas.ProgramUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    for key, value in program_in.model_dump(exclude_unset=True).items():
        setattr(program, key, value)
    db.commit()
    db.refresh(program)
    return program


@router.delete("/{program_id}")
def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(program)
    db.commit()
    return {"detail": "Deleted"}
