"""
Authentication service - Handles user authentication logic.
"""
from sqlalchemy.orm import Session
from app.models import Instructor, Student
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.auth import InstructorRegister, InstructorLogin, Token


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def register_instructor(self, data: InstructorRegister) -> Instructor:
        """
        Register a new instructor.
        
        Args:
            data: Registration data
            
        Returns:
            Created instructor
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email exists
        existing = self.db.query(Instructor).filter(
            Instructor.email == data.email
        ).first()
        
        if existing:
            raise ValueError("Email already registered")
        
        # Create instructor
        instructor = Instructor(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            department=data.department
        )
        
        self.db.add(instructor)
        self.db.commit()
        self.db.refresh(instructor)
        
        return instructor
    
    def login_instructor(self, data: InstructorLogin) -> Token:
        """
        Login instructor and return tokens.
        
        Args:
            data: Login credentials
            
        Returns:
            Token object with access and refresh tokens
            
        Raises:
            ValueError: If credentials are invalid
        """
        instructor = self.db.query(Instructor).filter(
            Instructor.email == data.email,
            Instructor.is_active == True
        ).first()
        
        if not instructor or not verify_password(data.password, instructor.password_hash):
            raise ValueError("Invalid email or password")
        
        return Token(
            access_token=create_access_token(str(instructor.id)),
            refresh_token=create_refresh_token(str(instructor.id))
        )
    
    def refresh_tokens(self, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New token pair
            
        Raises:
            ValueError: If refresh token is invalid
        """
        payload = decode_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        
        instructor_id = payload.get("sub")
        instructor = self.db.query(Instructor).filter(
            Instructor.id == instructor_id,
            Instructor.is_active == True
        ).first()
        
        if not instructor:
            raise ValueError("Instructor not found")
        
        return Token(
            access_token=create_access_token(str(instructor.id)),
            refresh_token=create_refresh_token(str(instructor.id))
        )
    
    def get_or_create_student(self, telegram_data: dict) -> Student:
        """
        Get existing student or create new one from Telegram data.
        
        Args:
            telegram_data: User data from Telegram
            
        Returns:
            Student instance
        """
        telegram_id = telegram_data.get('id')
        
        student = self.db.query(Student).filter(
            Student.telegram_id == telegram_id
        ).first()
        
        if not student:
            student = Student(
                telegram_id=telegram_id,
                telegram_username=telegram_data.get('username'),
                first_name=telegram_data.get('first_name'),
                last_name=telegram_data.get('last_name')
            )
            self.db.add(student)
            self.db.commit()
            self.db.refresh(student)
        
        return student
