"""
Telegram WebApp data validation.

Validates the initData sent from Telegram Mini Apps to ensure
the request is authentic and from a real Telegram user.

Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""
import hashlib
import hmac
import json
from urllib.parse import parse_qs, unquote
from datetime import datetime
from app.config import settings


def validate_telegram_webapp_data(init_data: str) -> dict | None:
    """
    Validate Telegram WebApp initData hash.
    
    This function validates the data integrity by:
    1. Parsing the init_data string
    2. Checking the auth_date is recent (within 24 hours)
    3. Computing the expected hash using HMAC-SHA256
    4. Comparing with the received hash
    
    Args:
        init_data: The initData string from Telegram WebApp
        
    Returns:
        User data dict if valid, None if invalid
    """
    if not init_data or not settings.TELEGRAM_BOT_TOKEN:
        return None
    
    try:
        # Parse the init_data string
        parsed_data = {}
        for pair in init_data.split('&'):
            if '=' in pair:
                key, value = pair.split('=', 1)
                parsed_data[key] = unquote(value)
        
        # Extract and remove hash
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            return None
            
        # Development bypass
        if settings.DEBUG and received_hash == "mock_hash_for_dev":
            user_data_str = parsed_data.get('user')
            if user_data_str:
                return json.loads(user_data_str)
        
        if not received_hash:
            return None
        
        # Check auth_date freshness (within 24 hours)
        auth_date_str = parsed_data.get('auth_date', '0')
        try:
            auth_date = int(auth_date_str)
        except ValueError:
            return None
            
        current_time = int(datetime.utcnow().timestamp())
        if current_time - auth_date > 86400:  # 24 hours
            return None
        
        # Build data-check-string by sorting parameters alphabetically
        data_pairs = []
        for key in sorted(parsed_data.keys()):
            data_pairs.append(f"{key}={parsed_data[key]}")
        
        data_check_string = "\n".join(data_pairs)
        
        # Create secret key using HMAC-SHA256
        # secret_key = HMAC_SHA256("WebAppData", bot_token)
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=settings.TELEGRAM_BOT_TOKEN.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Compare hashes using constant-time comparison
        if not hmac.compare_digest(calculated_hash, received_hash):
            return None
        
        # Parse and return user data
        user_data_str = parsed_data.get('user')
        if user_data_str:
            return json.loads(user_data_str)
        
        return None
        
    except Exception as e:
        print(f"Telegram validation error: {e}")
        return None


def get_telegram_webapp_url(path: str = "") -> str:
    """
    Get the full URL for the Telegram WebApp.
    
    Args:
        path: Optional path to append
        
    Returns:
        Full WebApp URL
    """
    base_url = settings.TELEGRAM_WEBAPP_URL.rstrip('/')
    if path:
        return f"{base_url}/{path.lstrip('/')}"
    return base_url
