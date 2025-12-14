"""
Quiz and QuizQuestionPool models.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Quiz(Base):
    """Quiz/Exam configuration model."""
    
    __tablename__ = "quizzes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Quiz info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Quiz settings
    question_count = Column(Integer, nullable=False)  # How many to pick from pool
    time_limit_minutes = Column(Integer, nullable=True)  # NULL = no limit
    randomize_questions = Column(Boolean, default=True)
    randomize_options = Column(Boolean, default=True)
    show_results = Column(Boolean, default=True)  # Show score after
    show_explanations = Column(Boolean, default=True)  # Show answer explanations
    passing_score = Column(Integer, default=60)  # Percentage to pass
    max_attempts = Column(Integer, default=1)
    
    # Scheduling
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    is_published = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    class_ = relationship("Class", back_populates="quizzes")
    instructor = relationship("Instructor", back_populates="quizzes")
    question_pool = relationship("QuizQuestionPool", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")
    
    @property
    def pool_size(self) -> int:
        """Get number of questions in the pool."""
        return len(self.question_pool)
    
    @property
    def is_available(self) -> bool:
        """Check if quiz is currently available."""
        if not self.is_published:
            return False
        now = datetime.utcnow()
        if self.start_time and now < self.start_time:
            return False
        if self.end_time and now > self.end_time:
            return False
        return True
    
    def __repr__(self):
        return f"<Quiz {self.title}>"


class QuizQuestionPool(Base):
    """Links questions to quizzes (question pool)."""
    
    __tablename__ = "quiz_question_pool"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint("quiz_id", "question_id", name="uq_quiz_question"),
    )
    
    # Relationships
    quiz = relationship("Quiz", back_populates="question_pool")
    question = relationship("Question", back_populates="quiz_pools")
    
    def __repr__(self):
        return f"<QuizQuestionPool quiz={self.quiz_id} question={self.question_id}>"
