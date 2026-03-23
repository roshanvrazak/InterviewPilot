# backend/app/services/evaluator.py
import json
from google import genai
from google.genai import types
from app.config import settings

class EvaluatorService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def generate_scorecard(self, transcript: str, job_description: str = None):
        jd_context = f"\n\nJob Description:\n{job_description}" if job_description else ""
        prompt = (
            "Analyze this mock interview transcript and return a JSON scorecard. "
            "The JSON should include:\n"
            "- overall_score (0-10)\n"
            "- summary (brief overview)\n"
            "- categories (object with category names as keys, each having 'score' (0-10) and 'feedback')\n"
            "- jd_match_score (0-100, representing how well the candidate matches the JD, if provided)\n"
            "- gap_analysis (list of skills or requirements from the JD that were missing or weak in the interview)\n"
            "- tailored_tips (list of 3-5 specific tips for this candidate to better align with this JD)\n\n"
            f"Transcript:\n{transcript}{jd_context}"
        )
        response = await self.client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
