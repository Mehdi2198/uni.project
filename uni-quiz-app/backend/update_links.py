
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Class
from app.config import settings

def update_links():
    db = SessionLocal()
    try:
        classes = db.query(Class).all()
        print(f"Found {len(classes)} classes.")
        
        bot_username = settings.TELEGRAM_BOT_USERNAME
        if not bot_username:
            print("TELEGRAM_BOT_USERNAME not set in config!")
            return

        print(f"Updating links to use bot: {bot_username}")
        
        count = 0
        for cls in classes:
            new_link = f"https://t.me/{bot_username}?start={cls.class_code}"
            if cls.invite_link != new_link:
                cls.invite_link = new_link
                count += 1
        
        db.commit()
        print(f"Updated {count} class invite links.")
        
    finally:
        db.close()

if __name__ == "__main__":
    update_links()
