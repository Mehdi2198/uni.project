"""
Authentication schemas.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class InstructorRegister(BaseModel):
    """Schema for instructor registration."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    department: Optional[str] = None


class InstructorLogin(BaseModel):
    """Schema for instructor login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Token refresh request."""
    refresh_token: str


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str
    type: str
    exp: int


class TelegramAuthData(BaseModel):
    """Telegram WebApp auth data."""
    init_data: str
