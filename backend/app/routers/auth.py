from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user, validate_password
from app.database import get_db

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # 비밀번호 정책 검증
    validate_password(user_in.password)

    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="user",  # 항상 'user'로 고정 — 관리자 자가 부여 방지
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(request: Request, credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
