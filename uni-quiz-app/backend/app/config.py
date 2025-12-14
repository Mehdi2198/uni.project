"""
University Quiz App - Configuration Settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Settings
    APP_NAME: str = "University Quiz App"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/uni_quiz_db"
    
    # JWT Settings
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""
    TELEGRAM_WEBAPP_URL: str = ""
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Redis (optional)
    REDIS_URL: str = ""
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
