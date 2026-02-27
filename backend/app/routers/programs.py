from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.ProgramOut])
def list_programs(db: Session = Depends(get_db)):
    """Public: List all active programs"""
    return db.query(models.Program).all()


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
