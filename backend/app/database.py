import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

# 로컬 개발: SQLite 사용 / 운영(Docker): PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./baikal_grant.db"
)

# ── 엔진 설정 (DB 종류별 최적화) ──────────────────────
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL: 커넥션 풀 설정
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_pre_ping=True,
    )
    logger.info("Database pool configured: pool_size=10, max_overflow=20")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
