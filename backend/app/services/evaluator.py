# backend/app/services/evaluator.py
import json
from google import genai
from google.genai import types
from app.config import settings

class EvaluatorService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def generate_scorecard(self, transcript: str):
        prompt = f"Analyze this mock interview transcript and return a JSON scorecard with overall_score, summary, and category scores:\n\n{transcript}"
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
