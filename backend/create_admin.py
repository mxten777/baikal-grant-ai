"""
초기 관리자 계정 생성 스크립트
Usage: python create_admin.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

email = os.getenv("ADMIN_EMAIL", "admin@baikal.ai")
password = os.getenv("ADMIN_PASSWORD", "admin1234")
full_name = os.getenv("ADMIN_NAME", "BAIKAL 관리자")

existing = db.query(models.User).filter(models.User.email == email).first()
if existing:
    print(f"관리자 계정 이미 존재: {email}")
else:
    admin = models.User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role="admin",
    )
    db.add(admin)
    db.commit()
    print(f"관리자 계정 생성 완료: {email} / {password}")

db.close()
