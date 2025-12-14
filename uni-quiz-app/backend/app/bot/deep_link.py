"""
Deep link utilities for Telegram bot.
"""
import secrets
from typing import Optional


def generate_class_code() -> str:
    """
    Generate a unique class code for deep linking.
    
    Format: class_<random_string>
    Example: class_Xk9m2Lp4qR
    
    Returns:
        A unique class code string
    """
    random_part = secrets.token_urlsafe(8)
    return f"class_{random_part}"


def parse_deep_link(start_payload: str) -> Optional[dict]:
    """
    Parse deep link payload from /start command.
    
    Args:
        start_payload: The payload after /start command
        
    Returns:
        Dict with parsed info or None if invalid
        
    Examples:
        "class_ABC123" -> {"type": "class", "code": "class_ABC123"}
        "quiz_XYZ789" -> {"type": "quiz", "code": "quiz_XYZ789"}
    """
    if not start_payload:
        return None
    
    payload = start_payload.strip()
    
    if payload.startswith("class_"):
        return {
            "type": "class",
            "code": payload
        }
    elif payload.startswith("quiz_"):
        return {
            "type": "quiz", 
            "code": payload
        }
    
    return None


def create_invite_link(bot_username: str, class_code: str) -> str:
    """
    Create a Telegram deep link for class enrollment.
    
    Args:
        bot_username: The bot's username (without @)
        class_code: The class code to embed
        
    Returns:
        Full Telegram deep link URL
        
    Example:
        create_invite_link("quiz_bot", "class_ABC123")
        -> "https://t.me/quiz_bot?start=class_ABC123"
    """
    return f"https://t.me/{bot_username}?start={class_code}"
