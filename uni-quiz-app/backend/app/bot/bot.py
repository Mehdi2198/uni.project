"""
Telegram Bot - Main bot instance and configuration.
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

from app.config import settings

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


def get_webapp_keyboard() -> InlineKeyboardMarkup:
    keyboard = [[
        InlineKeyboardButton(
            "📝 Open Quiz App",
            web_app=WebAppInfo(url=settings.TELEGRAM_WEBAPP_URL)
        )
    ]]
    return InlineKeyboardMarkup(keyboard)


def create_bot_application() -> Application:
    """
    Create and configure the Telegram bot application.
    
    Returns:
        Configured Application instance ready to run
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not configured")
    
    # Create application
    application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    
    # Import handlers here to avoid circular imports
    from app.bot.handlers import (
        start_command,
        help_command,
        quiz_command,
        error_handler
    )
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("quiz", quiz_command))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    return application


def run_bot():
    """Run the bot using polling (for development)."""
    application = create_bot_application()
    
    logger.info("Starting bot with polling...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


async def setup_webhook(webhook_url: str):
    """Set up webhook for production."""
    application = create_bot_application()
    
    await application.bot.set_webhook(
        url=f"{webhook_url}/api/bot/webhook",
        allowed_updates=Update.ALL_TYPES
    )
    
    logger.info(f"Webhook set to: {webhook_url}/api/bot/webhook")
