import asyncio
import os
import sys

# Add the current directory to python path to make 'app' importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.bot.bot import run_bot

if __name__ == "__main__":
    try:
        run_bot()
    except KeyboardInterrupt:
        print("Bot stopped by user")
    except Exception as e:
        print(f"Error running bot: {e}")
