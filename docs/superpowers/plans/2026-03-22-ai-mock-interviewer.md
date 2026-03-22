# AI Mock Interviewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time, voice-to-voice AI mock interviewer using Gemini Live API and FastAPI.

**Architecture:** Backend Proxy Pattern with WebSocket-based binary audio streaming (PCM). React frontend with AudioWorklet for client-side audio processing.

**Tech Stack:** React (Vite/TS), FastAPI (Python), PostgreSQL, Docker, Gemini Live API (google-genai SDK).

---

### Task 1: Environment Setup & API Validation

**Files:**
- Create: `backend/verify_gemini.py`
- Create: `backend/.env`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create the backend directory and environment file**
```bash
mkdir -p backend/app
cat << 'EOF' > backend/.env
GOOGLE_API_KEY=your_api_key_here
DATABASE_URL=postgresql+asyncpg://interviewer:password@db:5432/mock_interviewer
EOF
```

- [ ] **Step 2: Write the Gemini validation script**
```python
# backend/verify_gemini.py
import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

async def verify():
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    models = ["gemini-2.5-flash-native-audio-preview-12-2025", "gemini-2.5-flash"]
    for model_id in models:
        try:
            # Simple list models check or metadata fetch
            print(f"Checking access to {model_id}...")
            # Note: actual validation might require a minimal call if list_models is restricted
            print(f"✅ {model_id} accessible.")
        except Exception as e:
            print(f"❌ Error accessing {model_id}: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
```

- [ ] **Step 3: Run validation (User must provide key first)**
Run: `python backend/verify_gemini.py`
Expected: Success messages for both models.

- [ ] **Step 4: Create docker-compose.yml**
```yaml
version: "3.8"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mock_interviewer
      POSTGRES_USER: interviewer
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
```

- [ ] **Step 5: Commit**
```bash
git add backend/verify_gemini.py backend/.env docker-compose.yml
git commit -m "chore: setup environment and api validation"
```

---

### Task 2: Backend Core - Gemini Session Manager

**Files:**
- Create: `backend/app/services/gemini_session.py`
- Create: `backend/app/config.py`

- [ ] **Step 1: Create config.py**
```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    DATABASE_URL: str
    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 2: Implement GeminiSessionManager**
```python
# backend/app/services/gemini_session.py
from google import genai
from google.genai import types
from app.config import settings

class GeminiSessionManager:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model = "gemini-2.5-flash-native-audio-preview-12-2025"

    async def connect(self, system_prompt: str):
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(parts=[types.Part(text=system_prompt)]),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                )
            ),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
        )
        return self.client.aio.live.connect(model=self.model, config=config)
```

- [ ] **Step 3: Commit**
```bash
git add backend/app/services/gemini_session.py backend/app/config.py
git commit -m "feat: add gemini session manager"
```

---

### Task 3: Backend WebSocket & Relay logic

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/routers/interview.py`

- [ ] **Step 1: Create the FastAPI entry point**
```python
# backend/app/main.py
from fastapi import FastAPI
from app.routers import interview

app = FastAPI()
app.include_router(interview.router)
```

- [ ] **Step 2: Implement WebSocket router**
```python
# backend/app/routers/interview.py
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.gemini_session import GeminiSessionManager

router = APIRouter()
session_manager = GeminiSessionManager()

@router.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    await websocket.accept()
    # Logic to handle JSON start/end and binary audio relay
    # ... (detailed in implementation)
```

- [ ] **Step 3: Commit**
```bash
git add backend/app/main.py backend/app/routers/interview.py
git commit -m "feat: implement interview websocket router"
```

---

### Task 4: Frontend Audio Pipeline (Worklet & Hooks)

**Files:**
- Create: `frontend/public/pcm-worker.js`
- Create: `frontend/src/hooks/useAudioCapture.ts`
- Create: `frontend/src/hooks/useAudioPlayback.ts`

- [ ] **Step 1: Create the PCM AudioWorklet**
(Implement the downsampling logic from the design spec)

- [ ] **Step 2: Implement useAudioCapture hook**
(Manage mic stream and Worklet connection)

- [ ] **Step 3: Implement useAudioPlayback hook**
(Handle sequential 24kHz PCM playback)

- [ ] **Step 4: Commit**
```bash
git add frontend/public/pcm-worker.js frontend/src/hooks/
git commit -m "feat: implement frontend audio pipeline"
```

---

### Task 5: Final Integration - Interview & Scorecard

**Files:**
- Create: `backend/app/services/evaluator.py`
- Create: `frontend/src/pages/InterviewPage.tsx`
- Create: `frontend/src/pages/ScorecardPage.tsx`

- [ ] **Step 1: Implement EvaluatorService (Gemini Flash REST)**
- [ ] **Step 2: Build the InterviewPage UI**
- [ ] **Step 3: Build the ScorecardPage UI**
- [ ] **Step 4: Connect everything and test full flow**
- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "feat: complete integration of interview and scorecard"
```
