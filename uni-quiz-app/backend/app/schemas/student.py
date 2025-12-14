"""
Student-related schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.schemas.question import QuestionForStudent, QuestionOption


# ==================== Student Schemas ====================

class StudentResponse(BaseModel):
    """Student profile response."""
    id: UUID
    telegram_id: int
    telegram_username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    student_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    """Student profile update."""
    student_id: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)


# ==================== Class Enrollment Schemas ====================

class StudentClassResponse(BaseModel):
    """Class info for students."""
    id: UUID
    name: str
    description: Optional[str]
    instructor_name: str
    enrolled_at: datetime


# ==================== Quiz Attempt Schemas ====================

class StartQuizResponse(BaseModel):
    """Response when starting a quiz."""
    attempt_id: UUID
    quiz_id: UUID
    title: str
    description: Optional[str]
    question_count: int
    time_limit_minutes: Optional[int]
    questions: List[QuestionForStudent]
    started_at: datetime


class SubmitAnswerRequest(BaseModel):
    """Submit single answer."""
    question_id: UUID
    selected_answer: str


class SubmitQuizRequest(BaseModel):
    """Submit entire quiz."""
    answers: List[SubmitAnswerRequest]


class QuizResultQuestion(BaseModel):
    """Question result with explanation."""
    question_id: UUID
    question_text: str
    question_type: str
    options: Optional[List[QuestionOption]]
    selected_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    points: int
    points_earned: int
    explanation: Optional[str]
    image_url: Optional[str]


class QuizResultResponse(BaseModel):
    """Quiz result response."""
    attempt_id: UUID
    quiz_id: UUID
    quiz_title: str
    score: Decimal
    total_points: int
    earned_points: int
    passing_score: int
    passed: bool
    time_spent_seconds: Optional[int]
    started_at: datetime
    submitted_at: Optional[datetime]
    show_explanations: bool
    questions: Optional[List[QuizResultQuestion]] = None


class AttemptHistoryItem(BaseModel):
    """Quiz attempt history item."""
    attempt_id: UUID
    quiz_id: UUID
    quiz_title: str
    class_name: str
    score: Optional[Decimal]
    passed: bool
    started_at: datetime
    submitted_at: Optional[datetime]
    
    class Config:
        from_attributes = True
