"""
Instructor model for storing professor/instructor accounts.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Instructor(Base):
    """Instructor/Professor account model."""
    
    __tablename__ = "instructors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    classes = relationship("Class", back_populates="instructor", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="instructor", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="instructor", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Instructor {self.email}>"
