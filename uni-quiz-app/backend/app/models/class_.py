"""
Class model for instructor courses/classes.
"""
import uuid
import secrets
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def generate_class_code() -> str:
    """Generate a unique class code for deep linking."""
    return f"class_{secrets.token_urlsafe(8)}"


class Class(Base):
    """Course/Class model for instructors."""
    
    __tablename__ = "classes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    class_code = Column(String(50), unique=True, nullable=False, default=generate_class_code, index=True)
    invite_link = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    instructor = relationship("Instructor", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="class_", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="class_", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="class_")
    
    @property
    def student_count(self) -> int:
        """Get number of enrolled students."""
        return len([e for e in self.enrollments if e.is_active])
    
    def __repr__(self):
        return f"<Class {self.name} ({self.class_code})>"
