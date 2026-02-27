import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    import secrets
    SECRET_KEY = secrets.token_urlsafe(32)
    print("⚠️  WARNING: SECRET_KEY not set. Generated random key. Set SECRET_KEY env var in production!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "120"))  # 2 hours default

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ─── Password Policy ─────────────────────────────────────
PASSWORD_MIN_LENGTH = 8

def validate_password(password: str) -> str:
    """비밀번호 정책 검증: 최소 8자, 영문+숫자 포함"""
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(status_code=400, detail=f"비밀번호는 최소 {PASSWORD_MIN_LENGTH}자 이상이어야 합니다")
    if not re.search(r'[A-Za-z]', password):
        raise HTTPException(status_code=400, detail="비밀번호에 영문자가 포함되어야 합니다")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=400, detail="비밀번호에 숫자가 포함되어야 합니다")
    return password


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
