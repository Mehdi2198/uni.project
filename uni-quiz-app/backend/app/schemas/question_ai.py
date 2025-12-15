
from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionGenerateRequest(BaseModel):
    """Schema for text-to-question generation."""
    text: str = Field(..., min_length=50, max_length=20000)
    count: int = Field(default=5, ge=1, le=10)

class AIQuestionResponse(BaseModel):
    """Schema for AI generated question response."""
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
