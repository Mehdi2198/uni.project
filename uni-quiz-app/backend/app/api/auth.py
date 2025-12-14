"""
Authentication API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import InstructorRegister, InstructorLogin, Token, TokenRefresh, TelegramAuthData
from app.schemas.instructor import InstructorResponse
from app.services.auth_service import AuthService
from app.utils.telegram import validate_telegram_webapp_data

router = APIRouter()


@router.post("/instructor/register", response_model=InstructorResponse, status_code=status.HTTP_201_CREATED)
async def register_instructor(
    data: InstructorRegister,
    db: Session = Depends(get_db)
):
    """Register a new instructor account."""
    service = AuthService(db)
    
    try:
        instructor = service.register_instructor(data)
        return instructor
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/instructor/login", response_model=Token)
async def login_instructor(
    data: InstructorLogin,
    db: Session = Depends(get_db)
):
    """Login instructor and get JWT tokens."""
    service = AuthService(db)
    
    try:
        return service.login_instructor(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/instructor/refresh", response_model=Token)
async def refresh_token(
    data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    service = AuthService(db)
    
    try:
        return service.refresh_tokens(data.refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/telegram/validate")
async def validate_telegram_auth(
    data: TelegramAuthData,
    db: Session = Depends(get_db)
):
    """
    Validate Telegram WebApp initData.
    Returns user info if valid.
    """
    user_data = validate_telegram_webapp_data(data.init_data)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication"
        )
    
    # Get or create student
    service = AuthService(db)
    student = service.get_or_create_student(user_data)
    
    return {
        "valid": True,
        "user": {
            "id": str(student.id),
            "telegram_id": student.telegram_id,
            "username": student.telegram_username,
            "first_name": student.first_name,
            "last_name": student.last_name
        }
    }
