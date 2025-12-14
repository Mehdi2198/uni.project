"""
University Quiz App - Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.api import auth, instructor, student, bot

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="University Quiz Platform - Telegram Mini App + Web Admin Dashboard",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(instructor.router, prefix="/api/instructor", tags=["Instructor"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])
app.include_router(bot.router, prefix="/api/bot", tags=["Bot"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """API health check."""
    return {"status": "ok"}
