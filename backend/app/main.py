import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base
from app.routers import auth, programs, forms, applications, dashboard

# ─── Logging ───────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("baikal")

Base.metadata.create_all(bind=engine)

# ─── Rate Limiter ────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title="BAIKAL Grant AI",
    description="보조금·지원사업 접수 및 관리 시스템",
    version="1.2.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS: 환경변수로 허용 도메인 설정 ──────────────
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global Error Handler ──────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요."},
    )

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(programs.router, prefix="/api/programs", tags=["programs"])
app.include_router(forms.router, prefix="/api/forms", tags=["forms"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"message": "BAIKAL Grant AI API is running", "version": "1.2.0"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
