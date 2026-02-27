from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, programs, forms, applications, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BAIKAL Grant AI",
    description="보조금·지원사업 접수 및 관리 시스템",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(programs.router, prefix="/api/programs", tags=["programs"])
app.include_router(forms.router, prefix="/api/forms", tags=["forms"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"message": "BAIKAL Grant AI API is running"}
