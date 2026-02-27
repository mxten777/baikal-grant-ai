from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.auth import require_admin
from app.database import get_db

router = APIRouter()


@router.post("/", response_model=schemas.FormOut)
def create_form(
    form_in: schemas.FormCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    form = models.Form(**form_in.model_dump())
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/{form_id}", response_model=schemas.FormOut)
def get_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("/by-program/{program_id}", response_model=schemas.FormOut)
def get_form_by_program(program_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.program_id == program_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found for this program")
    return form


@router.post("/{form_id}/fields", response_model=schemas.FormFieldOut)
def add_field(
    form_id: int,
    field_in: schemas.FormFieldCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    field = models.FormField(form_id=form_id, **field_in.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.put("/{form_id}/fields/{field_id}", response_model=schemas.FormFieldOut)
def update_field(
    form_id: int,
    field_id: int,
    field_in: schemas.FormFieldCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    field = db.query(models.FormField).filter(
        models.FormField.id == field_id, models.FormField.form_id == form_id
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    for key, value in field_in.model_dump(exclude_unset=True).items():
        setattr(field, key, value)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/{form_id}/fields/{field_id}")
def delete_field(
    form_id: int,
    field_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    field = db.query(models.FormField).filter(
        models.FormField.id == field_id, models.FormField.form_id == form_id
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(field)
    db.commit()
    return {"detail": "Field deleted"}


@router.put("/{form_id}/fields/reorder")
def reorder_fields(
    form_id: int,
    field_ids: List[int],
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Reorder fields by passing ordered list of field IDs"""
    for index, field_id in enumerate(field_ids):
        db.query(models.FormField).filter(
            models.FormField.id == field_id, models.FormField.form_id == form_id
        ).update({"app_order": index})
    db.commit()
    return {"detail": "Reordered"}
