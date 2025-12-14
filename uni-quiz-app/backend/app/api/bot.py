"""
Bot API routes - Telegram webhook and enrollment handling.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.services.enrollment_service import EnrollmentService
from app.config import settings

router = APIRouter()


class EnrollRequest(BaseModel):
    """Request to enroll via deep link."""
    telegram_id: int
    telegram_username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    class_code: str


class WebhookUpdate(BaseModel):
    """Telegram webhook update (simplified)."""
    update_id: int
    message: Optional[dict] = None


@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Telegram webhook updates.
    
    This endpoint receives updates from Telegram when users interact with the bot.
    Main use case: handling /start command with deep link payload.
    """
    try:
        update = await request.json()
    except Exception:
        return {"ok": True}
    
    message = update.get("message")
    if not message:
        return {"ok": True}
    
    text = message.get("text", "")
    from_user = message.get("from", {})
    
    # Handle /start command with potential deep link
    if text.startswith("/start"):
        parts = text.split(" ", 1)
        class_code = parts[1] if len(parts) > 1 else None
        
        service = EnrollmentService(db)
        
        # Get or create student
        student = service.get_or_create_student(
            telegram_id=from_user.get("id"),
            username=from_user.get("username"),
            first_name=from_user.get("first_name"),
            last_name=from_user.get("last_name")
        )
        
        # Enroll if class code provided
        if class_code and class_code.startswith("class_"):
            enrollment, message_text = service.enroll_student_by_code(
                student.id, class_code
            )
            # Note: Actual message sending handled by separate bot process
            return {"ok": True, "action": "enroll", "message": message_text}
        
        return {"ok": True, "action": "start"}
    
    return {"ok": True}


@router.post("/enroll")
async def enroll_student(
    data: EnrollRequest,
    db: Session = Depends(get_db)
):
    """
    Enroll a student via deep link.
    
    Called by the bot when processing /start with class code.
    """
    service = EnrollmentService(db)
    
    # Get or create student
    student = service.get_or_create_student(
        telegram_id=data.telegram_id,
        username=data.telegram_username,
        first_name=data.first_name,
        last_name=data.last_name
    )
    
    # Enroll in class
    enrollment, message = service.enroll_student_by_code(
        student.id, data.class_code
    )
    
    if enrollment:
        return {
            "success": True,
            "message": message,
            "student_id": str(student.id),
            "class_id": str(enrollment.class_id)
        }
    else:
        raise HTTPException(status_code=400, detail=message)


@router.get("/info")
async def get_bot_info():
    """Get bot configuration info."""
    return {
        "webapp_url": settings.TELEGRAM_WEBAPP_URL,
        "bot_configured": bool(settings.TELEGRAM_BOT_TOKEN)
    }
