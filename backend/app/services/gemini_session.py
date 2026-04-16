import logging
from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiSessionManager:
    def __init__(self):
        key = settings.GOOGLE_API_KEY
        masked_key = f"{key[:4]}...{key[-4:]}" if key else "MISSING"
        logger.info(f"Initializing GeminiSessionManager with API key: {masked_key}")
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        # Use stable gemini-2.0-flash for better performance and reliability
        self.model = "gemini-2.0-flash"

    async def connect(self, system_prompt: str, voice_name: str = "Kore"):
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(parts=[types.Part(text=system_prompt)]),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            ),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
        )
        return self.client.aio.live.connect(model=self.model, config=config)

    async def check_connectivity(self) -> bool:
        try:
            # Attempt to fetch model metadata to verify API key and model access
            self.client.models.get(model=self.model)
            return True
        except Exception as e:
            # Log the error if needed
            return False
