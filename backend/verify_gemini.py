import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

async def verify():
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    models = ["gemini-2.0-flash-exp", "gemini-1.5-flash"] # Note: Correcting the provided model names if necessary, but the plan requested specific ones.
    # Wait, the prompt said: "gemini-2.5-flash-native-audio-preview-12-2025", "gemini-2.5-flash"
    # Actually, Gemini 2.5 isn't out yet (it's 2.0).
    # But I should follow the plan's specific request.
    models = ["gemini-2.0-flash-exp", "gemini-1.5-flash"] # Actually, I'll stick to the plan's exact model names first.
    # If it fails, I'll know why.
    models = ["gemini-2.5-flash-native-audio-preview-12-2025", "gemini-2.5-flash"]
    for model_id in models:
        try:
            print(f"Checking access to {model_id}...")
            # We'll try a simple models.get to verify existence/access
            model = client.models.get(model=model_id)
            print(f"✅ {model_id} accessible. Display name: {model.display_name}")
        except Exception as e:
            print(f"❌ Error accessing {model_id}: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
