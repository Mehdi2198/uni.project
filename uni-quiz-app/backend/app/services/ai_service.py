
import json
import logging
import os
from typing import List, Optional

import google.generativeai as genai
from fastapi import UploadFile

from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. AI features will be disabled.")
            self.model = None
        else:
            genai.configure(api_key=self.api_key)
            # Use specific model version to ensure availability
            self.model = genai.GenerativeModel('gemini-flash-latest')

    def _clean_json_response(self, text: str) -> str:
        """Clean markdown code blocks from response."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    async def generate_questions_from_text(self, text: str, count: int = 5) -> List[dict]:
        """Generate multiple choice questions from text."""
        if not self.model:
            raise ValueError("AI service is not configured (missing API key)")

        prompt = f"""
        Analyze the following text and generate {count} multiple-choice questions.
        Return the result ONLY as a JSON array of objects.
        
        Each object must have this format:
        {{
            "question_text": "The question string",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correct_answer": "The exact string of the correct option",
            "explanation": "Brief explanation of why this answer is correct"
        }}

        Text to analyze:
        {text[:5000]}
        """

        try:
            response = self.model.generate_content(prompt)
            cleaned_json = self._clean_json_response(response.text)
            return json.loads(cleaned_json)
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Error generating questions from text: {e}")
            raise ValueError(f"Failed to generate questions: {str(e)}")

    async def generate_questions_from_image(self, image_file: UploadFile) -> List[dict]:
        """Extract and generate questions from an image."""
        if not self.model:
            raise ValueError("AI service is not configured (missing API key)")

        try:
            # Read image content
            content = await image_file.read()
            
            # Create image part for Gemini
            image_part = {
                "mime_type": image_file.content_type,
                "data": content
            }

            prompt = """
            Extract all multiple-choice questions from this image.
            If the image contains handwritten notes, transcribe them into questions.
            Verify the correct answer if marked, otherwise estimate the correct answer.
            
            Return the result ONLY as a JSON array of objects with this format:
            {
                "question_text": "The question string",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correct_answer": "The exact string of the correct option",
                "explanation": "Brief explanation"
            }
            """

            response = self.model.generate_content([prompt, image_part])
            cleaned_json = self._clean_json_response(response.text)
            return json.loads(cleaned_json)
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            raise ValueError(f"Failed to process image: {str(e)}")

ai_service = AIService()
