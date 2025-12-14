"""
Question-related schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID


class QuestionOption(BaseModel):
    """Single option for multiple choice questions."""
    id: str  # a, b, c, d, etc.
    text: str


class QuestionCreate(BaseModel):
    """Schema for creating a question."""
    class_id: Optional[UUID] = None
    question_text: str = Field(..., min_length=5)
    question_type: str = Field(default="multiple_choice", pattern="^(multiple_choice|true_false|short_answer)$")
    options: Optional[List[QuestionOption]] = None
    correct_answer: str
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    points: int = Field(default=1, ge=1, le=100)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    tags: Optional[List[str]] = None


class QuestionUpdate(BaseModel):
    """Schema for updating a question."""
    class_id: Optional[UUID] = None
    question_text: Optional[str] = Field(None, min_length=5)
    question_type: Optional[str] = Field(None, pattern="^(multiple_choice|true_false|short_answer)$")
    options: Optional[List[QuestionOption]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    points: Optional[int] = Field(None, ge=1, le=100)
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class QuestionResponse(BaseModel):
    """Question response schema (full - for instructors)."""
    id: UUID
    instructor_id: UUID
    class_id: Optional[UUID]
    question_text: str
    question_type: str
    options: Optional[List[QuestionOption]]
    correct_answer: str
    explanation: Optional[str]
    image_url: Optional[str]
    points: int
    difficulty: str
    tags: Optional[List[str]]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestionListResponse(BaseModel):
    """List of questions response."""
    questions: List[QuestionResponse]
    total: int


class QuestionForStudent(BaseModel):
    """Question schema for students (no correct answer)."""
    id: UUID
    question_text: str
    question_type: str
    options: Optional[List[QuestionOption]]
    image_url: Optional[str]
    points: int
    
    class Config:
        from_attributes = True


class BulkQuestionImport(BaseModel):
    """Bulk import questions schema."""
    class_id: Optional[UUID] = None
    questions: List[QuestionCreate]
