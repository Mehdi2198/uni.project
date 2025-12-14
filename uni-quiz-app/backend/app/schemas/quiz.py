"""
Quiz-related schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class QuizCreate(BaseModel):
    """Schema for creating a quiz."""
    class_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    question_count: int = Field(..., ge=1, le=500)
    time_limit_minutes: Optional[int] = Field(None, ge=1, le=480)
    randomize_questions: bool = True
    randomize_options: bool = True
    show_results: bool = True
    show_explanations: bool = True
    passing_score: int = Field(default=60, ge=0, le=100)
    max_attempts: int = Field(default=1, ge=1, le=10)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class QuizUpdate(BaseModel):
    """Schema for updating a quiz."""
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    question_count: Optional[int] = Field(None, ge=1, le=500)
    time_limit_minutes: Optional[int] = Field(None, ge=1, le=480)
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    show_results: Optional[bool] = None
    show_explanations: Optional[bool] = None
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    max_attempts: Optional[int] = Field(None, ge=1, le=10)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class QuizResponse(BaseModel):
    """Quiz response schema."""
    id: UUID
    class_id: UUID
    instructor_id: UUID
    title: str
    description: Optional[str]
    question_count: int
    time_limit_minutes: Optional[int]
    randomize_questions: bool
    randomize_options: bool
    show_results: bool
    show_explanations: bool
    passing_score: int
    max_attempts: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    is_published: bool
    pool_size: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuizListResponse(BaseModel):
    """List of quizzes response."""
    quizzes: List[QuizResponse]
    total: int


class QuizForStudent(BaseModel):
    """Quiz info for students."""
    id: UUID
    title: str
    description: Optional[str]
    question_count: int
    time_limit_minutes: Optional[int]
    max_attempts: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    is_available: bool = False
    attempts_used: int = 0
    
    class Config:
        from_attributes = True


class AddQuestionsToQuiz(BaseModel):
    """Add questions to quiz pool."""
    question_ids: List[UUID]


class QuizPublish(BaseModel):
    """Publish quiz."""
    is_published: bool = True
