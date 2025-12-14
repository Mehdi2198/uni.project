import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = Path("uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

def save_upload_file(upload_file: UploadFile, sub_dir: str = "images") -> str:
    """
    Save an uploaded file to the uploads directory.
    
    Args:
        upload_file: The file to save
        sub_dir: Subdirectory within uploads
        
    Returns:
        The URL path to the saved file
    """
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")
        
    ext = Path(upload_file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Create directory if not exists
    save_dir = UPLOAD_DIR / sub_dir
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4()}{ext}"
    file_path = save_dir / filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()
        
    # Return URL path (assuming mounted at /uploads)
    return f"/uploads/{sub_dir}/{filename}"
