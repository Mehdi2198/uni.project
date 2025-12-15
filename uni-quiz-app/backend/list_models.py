
import asyncio
import os
import sys
import google.generativeai as genai

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

def list_models():
    print(f"API Key: {'Present' if settings.GEMINI_API_KEY else 'Missing'}")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    try:
        print("Listing available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_models()
