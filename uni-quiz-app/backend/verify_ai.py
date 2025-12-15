
import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import ai_service
from app.config import settings

async def main():
    print("--- Verifying AI Service ---")
    print(f"API Key present: {bool(settings.GEMINI_API_KEY)}")
    
    if not settings.GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY is missing in settings!")
        return

    text_to_process = """
    Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.
    Python is dynamically-typed and garbage-collected. It supports multiple programming paradigms, including structured (particularly procedural), object-oriented and functional programming.
    """
    
    print("\n1. Testing Text-to-Question Generation...")
    print(f"Input Text: {text_to_process.strip()}...")
    
    try:
        questions = await ai_service.generate_questions_from_text(text_to_process, count=2)
        print(f"\nSUCCESS! Generated {len(questions)} questions:")
        for i, q in enumerate(questions, 1):
            print(f"\nQ{i}: {q['question_text']}")
            print(f"   Options: {q['options']}")
            print(f"   Correct: {q['correct_answer']}")
            print(f"   Explanation: {q['explanation']}")
            
    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
