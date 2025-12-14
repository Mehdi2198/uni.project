"""
API Dependencies - Database session, authentication, etc.
"""
from typing import Generator
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import SessionLocal, get_db
from app.config import settings
from app.models import Instructor, Student
from app.utils.telegram import validate_telegram_webapp_data

# Security scheme for JWT
security = HTTPBearer()


def get_current_instructor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Instructor:
    """
    Dependency to validate JWT and get current instructor.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        instructor_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if instructor_id is None or token_type != "access":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    instructor = db.query(Instructor).filter(
        Instructor.id == instructor_id,
        Instructor.is_active == True
    ).first()
    
    if instructor is None:
        raise credentials_exception
    
    return instructor


def get_current_student(
    x_telegram_init_data: str = Header(..., alias="X-Telegram-Init-Data"),
    db: Session = Depends(get_db)
) -> Student:
    """
    Dependency to validate Telegram WebApp data and get current student.
    """
    user_data = validate_telegram_webapp_data(x_telegram_init_data)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication"
        )
    
    student = db.query(Student).filter(
        Student.telegram_id == user_data['id'],
        Student.is_active == True
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not registered. Use /start command first."
        )
    
    return student


def get_optional_student(
    x_telegram_init_data: str = Header(None, alias="X-Telegram-Init-Data"),
    db: Session = Depends(get_db)
) -> Student | None:
    """
    Optional student authentication - returns None if not authenticated.
    """
    if not x_telegram_init_data:
        return None
    
    user_data = validate_telegram_webapp_data(x_telegram_init_data)
    if not user_data:
        return None
    
    return db.query(Student).filter(
        Student.telegram_id == user_data['id'],
        Student.is_active == True
    ).first()
