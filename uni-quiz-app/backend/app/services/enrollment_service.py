"""
Enrollment service - Handles student enrollments via deep links.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models import Student, Class, Enrollment
from app.config import settings


class EnrollmentService:
    """Service for handling student enrollments."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_student(
        self,
        telegram_id: int,
        username: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Student:
        """Get existing student or create new one."""
        student = self.db.query(Student).filter(
            Student.telegram_id == telegram_id
        ).first()
        
        if not student:
            student = Student(
                telegram_id=telegram_id,
                telegram_username=username,
                first_name=first_name,
                last_name=last_name
            )
            self.db.add(student)
            self.db.commit()
            self.db.refresh(student)
        else:
            # Update info if changed
            if username and student.telegram_username != username:
                student.telegram_username = username
            if first_name and student.first_name != first_name:
                student.first_name = first_name
            if last_name and student.last_name != last_name:
                student.last_name = last_name
            self.db.commit()
        
        return student
    
    def enroll_student_by_code(
        self,
        student_id: UUID,
        class_code: str
    ) -> tuple[Enrollment | None, str]:
        """
        Enroll student in class using class code (from deep link).
        
        Args:
            student_id: Student's UUID
            class_code: Class code from deep link (e.g., 'class_xyz123')
            
        Returns:
            Tuple of (Enrollment or None, status message)
        """
        # Find class by code
        target_class = self.db.query(Class).filter(
            Class.class_code == class_code,
            Class.is_active == True
        ).first()
        
        if not target_class:
            return None, "Invalid or expired class link"
        
        # Check if already enrolled
        existing = self.db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.class_id == target_class.id
        ).first()
        
        if existing:
            if existing.is_active:
                return existing, f"Already enrolled in: {target_class.name}"
            else:
                # Reactivate enrollment
                existing.is_active = True
                existing.enrolled_at = datetime.utcnow()
                self.db.commit()
                return existing, f"Re-enrolled in: {target_class.name}"
        
        # Create new enrollment
        enrollment = Enrollment(
            student_id=student_id,
            class_id=target_class.id
        )
        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)
        
        return enrollment, f"Successfully enrolled in: {target_class.name}"
    
    def generate_invite_link(self, class_id: UUID) -> str:
        """
        Generate/get invite link for a class.
        
        Args:
            class_id: Class UUID
            
        Returns:
            Telegram deep link URL
        """
        target_class = self.db.query(Class).filter(Class.id == class_id).first()
        
        if not target_class:
            raise ValueError("Class not found")
        
        # Generate link if not exists
        if not target_class.invite_link:
            # Format: t.me/botname?start=class_CODE
            bot_username = settings.TELEGRAM_BOT_TOKEN.split(':')[0] if settings.TELEGRAM_BOT_TOKEN else "yourbot"
            # In production, you'd get the actual bot username from Telegram API
            target_class.invite_link = f"https://t.me/{bot_username}?start={target_class.class_code}"
            self.db.commit()
        
        return target_class.invite_link
    
    def get_student_classes(self, student_id: UUID) -> list:
        """Get all classes a student is enrolled in."""
        enrollments = self.db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.is_active == True
        ).all()
        
        return [e.class_ for e in enrollments if e.class_ and e.class_.is_active]
    
    def get_class_students(self, class_id: UUID) -> list:
        """Get all students enrolled in a class."""
        enrollments = self.db.query(Enrollment).filter(
            Enrollment.class_id == class_id,
            Enrollment.is_active == True
        ).all()
        
        return enrollments
    
    def unenroll_student(self, student_id: UUID, class_id: UUID) -> bool:
        """Remove student from class."""
        enrollment = self.db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.class_id == class_id
        ).first()
        
        if enrollment:
            enrollment.is_active = False
            self.db.commit()
            return True
        
        return False
