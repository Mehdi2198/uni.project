"""
Telegram Bot - Command handlers.
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ContextTypes

from app.config import settings
from app.database import SessionLocal
from app.services.enrollment_service import EnrollmentService

logger = logging.getLogger(__name__)


def get_webapp_keyboard() -> InlineKeyboardMarkup:
    """Create inline keyboard with Mini App button."""
    if not settings.TELEGRAM_WEBAPP_URL:
        return None
    
    keyboard = [[
        InlineKeyboardButton(
            "📝 Open Quiz App",
            web_app=WebAppInfo(url=settings.TELEGRAM_WEBAPP_URL)
        )
    ]]
    return InlineKeyboardMarkup(keyboard)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle /start command with optional deep link payload.
    
    Usage:
        /start - Normal start
        /start class_ABC123 - Enroll in class via deep link
    """
    user = update.effective_user
    args = context.args  # Deep link payload
    
    # Create database session
    db = SessionLocal()
    try:
        service = EnrollmentService(db)
        
        # Get or create student
        student = service.get_or_create_student(
            telegram_id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name
        )
        
        # Check for deep link (class enrollment)
        if args and len(args) > 0:
            class_code = args[0]
            
            if class_code.startswith("class_"):
                enrollment, message = service.enroll_student_by_code(
                    student.id, class_code
                )
                
                if enrollment:
                    await update.message.reply_text(
                        f"✅ {message}\n\n"
                        f"Welcome, {user.first_name}! 🎓\n"
                        f"Open the Quiz App to see available quizzes.",
                        reply_markup=get_webapp_keyboard()
                    )
                else:
                    await update.message.reply_text(
                        f"❌ {message}\n\n"
                        f"Please contact your instructor for a valid link.",
                        reply_markup=get_webapp_keyboard()
                    )
                return
        
        # Normal /start without deep link
        await update.message.reply_text(
            f"👋 Welcome to University Quiz Bot, {user.first_name}!\n\n"
            f"🎓 This bot helps you take quizzes for your university classes.\n\n"
            f"📌 How to get started:\n"
            f"1. Get an invite link from your instructor\n"
            f"2. Click the link to enroll in the class\n"
            f"3. Open the Quiz App to take quizzes\n\n"
            f"💡 Commands:\n"
            f"/help - Show help message\n"
            f"/quiz - Open quiz app",
            reply_markup=get_webapp_keyboard()
        )
        
    finally:
        db.close()


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    await update.message.reply_text(
        "📚 *University Quiz Bot Help*\n\n"
        "*Commands:*\n"
        "/start - Start the bot\n"
        "/help - Show this help message\n"
        "/quiz - Open the quiz app\n\n"
        "*How it works:*\n"
        "1. Your instructor will share a class invite link\n"
        "2. Click the link to automatically enroll\n"
        "3. Use the Quiz App button to take quizzes\n"
        "4. View your scores and explanations after each quiz\n\n"
        "*Need help?*\n"
        "Contact your instructor or course administrator.",
        parse_mode="Markdown",
        reply_markup=get_webapp_keyboard()
    )


async def quiz_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /quiz command - Quick access to quiz app."""
    keyboard = get_webapp_keyboard()
    
    if keyboard:
        await update.message.reply_text(
            "📝 Click the button below to open the Quiz App!",
            reply_markup=keyboard
        )
    else:
        await update.message.reply_text(
            "⚠️ Quiz App is not configured yet. Please try again later."
        )


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle errors in the bot."""
    logger.error(f"Exception while handling an update: {context.error}")
    
    if update and hasattr(update, 'effective_message') and update.effective_message:
        await update.effective_message.reply_text(
            "❌ Sorry, something went wrong. Please try again later."
        )
