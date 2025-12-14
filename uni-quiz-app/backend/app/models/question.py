"""
Question model for the question bank.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    """Question model for the question bank."""
    
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Question content
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), nullable=False, default="multiple_choice")
    # Types: 'multiple_choice', 'true_false', 'short_answer'
    
    # For multiple choice: [{"id": "a", "text": "Option A"}, ...]
    options = Column(JSONB, nullable=True)
    correct_answer = Column(String(255), nullable=False)  # Answer key or option id
    explanation = Column(Text, nullable=True)  # Shown after quiz
    
    # Media
    image_url = Column(String(500), nullable=True)
    
    # Scoring & metadata
    points = Column(Integer, default=1)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    tags = Column(JSONB, nullable=True)  # ["chapter1", "midterm", ...]
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    instructor = relationship("Instructor", back_populates="questions")
    class_ = relationship("Class", back_populates="questions")
    quiz_pools = relationship("QuizQuestionPool", back_populates="question", cascade="all, delete-orphan")
    student_answers = relationship("StudentAnswer", back_populates="question")
    
    def __repr__(self):
        return f"<Question {self.id}: {self.question_text[:50]}...>"
