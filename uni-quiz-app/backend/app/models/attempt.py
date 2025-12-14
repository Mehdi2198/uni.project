"""
QuizAttempt and StudentAnswer models for tracking quiz attempts.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class QuizAttempt(Base):
    """Student's quiz attempt session."""
    
    __tablename__ = "quiz_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timing
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)
    
    # Scoring
    score = Column(Numeric(5, 2), nullable=True)  # Percentage score
    total_points = Column(Integer, nullable=True)
    earned_points = Column(Integer, nullable=True)
    
    is_completed = Column(Boolean, default=False)
    
    # Stores the randomized question IDs for this specific attempt
    questions_order = Column(JSONB, nullable=True)  # ["uuid1", "uuid2", ...]
    
    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("Student", back_populates="quiz_attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    
    @property
    def passed(self) -> bool:
        """Check if student passed the quiz."""
        if self.score is None:
            return False
        return self.score >= (self.quiz.passing_score if self.quiz else 60)
    
    def calculate_score(self) -> None:
        """Calculate and update the score based on answers."""
        total = 0
        earned = 0
        for answer in self.answers:
            if answer.question:
                total += answer.question.points
                if answer.is_correct:
                    earned += answer.question.points
        
        self.total_points = total
        self.earned_points = earned
        self.score = Decimal(earned / total * 100) if total > 0 else Decimal(0)
    
    def __repr__(self):
        return f"<QuizAttempt {self.id} student={self.student_id}>"


class StudentAnswer(Base):
    """Individual answer for a question in an attempt."""
    
    __tablename__ = "student_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    selected_answer = Column(String(500), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    points_earned = Column(Integer, default=0)
    answered_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="student_answers")
    
    def check_answer(self) -> bool:
        """Check if the answer is correct and update is_correct field."""
        if self.question and self.selected_answer:
            self.is_correct = self.selected_answer.strip().lower() == self.question.correct_answer.strip().lower()
            self.points_earned = self.question.points if self.is_correct else 0
        else:
            self.is_correct = False
            self.points_earned = 0
        return self.is_correct
    
    def __repr__(self):
        return f"<StudentAnswer {self.id} correct={self.is_correct}>"
