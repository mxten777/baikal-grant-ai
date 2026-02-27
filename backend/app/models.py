from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="user")  # admin, user, reviewer
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    applications = relationship("Application", back_populates="user")


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    apply_start_date = Column(DateTime(timezone=True))
    apply_end_date = Column(DateTime(timezone=True))
    budget_amount = Column(Numeric(15, 2))
    status = Column(String(50), default="draft")  # draft, active, closed
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    form = relationship("Form", back_populates="program", uselist=False)
    applications = relationship("Application", back_populates="program")


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    program = relationship("Program", back_populates="form")
    fields = relationship("FormField", back_populates="form", order_by="FormField.app_order")


class FormField(Base):
    __tablename__ = "form_fields"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"))
    field_type = Column(String(50), nullable=False)  # text, number, select, checkbox, date, file, agreement
    label = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    options = Column(JSON)  # For select/checkbox options: [{"label": "...", "value": "..."}]
    is_required = Column(Boolean, default=False)
    app_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    form = relationship("Form", back_populates="fields")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50), default="draft")
    # draft, submitted, under_review, revision_requested, approved, rejected, completed
    submission_date = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    application_number = Column(String(50), unique=True)

    program = relationship("Program", back_populates="applications")
    user = relationship("User", back_populates="applications")
    answers = relationship("ApplicationAnswer", back_populates="application", cascade="all, delete-orphan")
    files = relationship("ApplicationFile", back_populates="application", cascade="all, delete-orphan")
    logs = relationship("WorkflowLog", back_populates="application", cascade="all, delete-orphan")


class ApplicationAnswer(Base):
    __tablename__ = "application_answers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    field_id = Column(Integer, ForeignKey("form_fields.id"))
    value = Column(Text)
    value_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="answers")
    field = relationship("FormField")


class ApplicationFile(Base):
    __tablename__ = "application_files"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    field_id = Column(Integer, ForeignKey("form_fields.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="files")


class WorkflowLog(Base):
    __tablename__ = "workflow_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    actor_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    previous_status = Column(String(50))
    new_status = Column(String(50))
    comments = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="logs")
    actor = relationship("User")
