# Design Spec: Real-Time AI Mock Interviewer

## 1. Project Overview
A web application that conducts real-time, voice-to-voice mock interviews using the Gemini Live API. Users select a job role, participate in a 5-8 question interview, and receive a structured performance scorecard.

### Goals
- Low-latency bidirectional audio streaming.
- Professional interviewer persona using Gemini Live.
- Structured performance evaluation (JSON scorecard).
- Production-ready Docker/Homelab deployment.

## 2. Technical Architecture
The system uses a **Backend Proxy Pattern** to secure API keys and manage session state.

- **Frontend (React/Vite/TS):** Manages UI and `AudioContext`.
- **Backend (FastAPI/Python):** Manages WebSockets and Gemini sessions.
- **AI Stack (Unified Gemini):**
    - **Interview:** `gemini-2.5-flash-native-audio-preview-12-2025` (Live API).
    - **Scorecard:** `gemini-2.5-flash` (REST API).
- **Database:** PostgreSQL for session metadata and scorecards.
- **Infrastructure:** Docker Compose with Postgres and FastAPI containers.

## 3. Detailed Components

### 3.1 Frontend Pipeline
- **Audio Capture:** `AudioWorklet` to downsample mic input (48kHz Float32) to Gemini-compatible 16kHz Int16 PCM.
- **Audio Playback:** `AudioContext` to buffer and play 24kHz Int16 PCM output from Gemini.
- **WebSocket:** Bidirectional binary (PCM) and JSON (transcripts/control) transport.

### 3.2 Backend Services
- **GeminiSessionManager:** Handles `google-genai` Live API lifecycle.
- **TranscriptAccumulator:** Buffers real-time transcriptions for evaluation.
- **EvaluatorService:** Generates the JSON scorecard post-interview.
- **Validation Script:** A standalone `verify_gemini.py` to confirm API key access to specific models.

### 3.3 Database Schema
- `interview_sessions`: Metadata, role, start/end times.
- `transcript_entries`: Full log of the conversation.
- `scorecards`: Final evaluation JSON.

## 4. Implementation Plan (Phases)
1. **Phase 1: Environment & Validation.** Set up Docker, Postgres, and run the API key validation script.
2. **Phase 2: Audio Proof-of-Concept.** Basic WebSocket relay for voice-to-voice interaction.
3. **Phase 3: Interview Flow.** Role selection, system prompts, and transcript accumulation.
4. **Phase 4: Evaluation & Scorecard.** JSON scorecard generation and persistence.
5. **Phase 5: Polish & Deployment.** UI/UX refinements and Docker optimization.

## 5. Deployment
- **Docker Compose:** Orchestrates App + DB.
- **Cloudflare Tunnels:** (Configuration only) for remote access.
- **Environment Variables:** Securely managed via `.env`.
