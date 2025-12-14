"""
Enrollment model for student-class relationships.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Enrollment(Base):
    """Student enrollment in a class (many-to-many)."""
    
    __tablename__ = "enrollments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_student_class"),
    )
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    
    def __repr__(self):
        return f"<Enrollment student={self.student_id} class={self.class_id}>"
