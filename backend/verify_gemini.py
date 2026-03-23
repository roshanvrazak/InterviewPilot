import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

async def verify():
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        print("❌ GOOGLE_API_KEY not found in environment.")
        return

    print(f"Checking models for key: {key[:6]}...{key[-4:]}")
    client = genai.Client(api_key=key)
    
    try:
        print("\nAvailable Models:")
        for model in client.models.list():
            print(f"- {model.name} (Supported actions: {model.supported_generation_methods})")
    except Exception as e:
        print(f"❌ Error listing models: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
