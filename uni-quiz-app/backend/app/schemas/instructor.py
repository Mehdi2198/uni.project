"""
Instructor-related schemas.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ==================== Instructor Schemas ====================

class InstructorBase(BaseModel):
    """Base instructor schema."""
    email: EmailStr
    full_name: str
    department: Optional[str] = None


class InstructorResponse(InstructorBase):
    """Instructor response schema."""
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class InstructorUpdate(BaseModel):
    """Instructor update schema."""
    full_name: Optional[str] = None
    department: Optional[str] = None


# ==================== Class Schemas ====================

class ClassCreate(BaseModel):
    """Schema for creating a class."""
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None


class ClassUpdate(BaseModel):
    """Schema for updating a class."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ClassResponse(BaseModel):
    """Class response schema."""
    id: UUID
    instructor_id: UUID
    name: str
    description: Optional[str]
    class_code: str
    invite_link: Optional[str]
    is_active: bool
    created_at: datetime
    student_count: int = 0
    
    class Config:
        from_attributes = True


class ClassListResponse(BaseModel):
    """List of classes response."""
    classes: List[ClassResponse]
    total: int


class InviteLinkResponse(BaseModel):
    """Invite link response."""
    class_id: UUID
    class_code: str
    invite_link: str


# ==================== Enrolled Student Schemas ====================

class EnrolledStudentResponse(BaseModel):
    """Enrolled student info for instructors."""
    id: UUID
    telegram_id: int
    telegram_username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    student_id: Optional[str]
    enrolled_at: datetime
    
    class Config:
        from_attributes = True
