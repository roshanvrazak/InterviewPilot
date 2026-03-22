# Master Context: Real-Time AI Mock Interviewer

> **Purpose:** This document is the single source of truth for building the "Real-Time AI Mock Interviewer" — a web application that conducts live, voice-to-voice mock interviews using the Gemini Live API. Feed this entire file as context to your AI coding assistant at the start of each session.

---

## 1. Project Overview

### What We're Building

A web application where a user selects a target job role (e.g. "Software Engineer", "Product Manager", "Data Scientist"), then has a **real-time, voice-to-voice mock interview** with an AI interviewer. After the interview ends, the system generates a **text-based performance scorecard** with per-answer feedback.

### Why It Matters (Portfolio Value)

This project demonstrates: real-time audio streaming, WebSocket bidirectional communication, low-latency API integration, browser audio capture/playback via Web Audio API, system prompt engineering for persona control, and structured evaluation pipelines — all skills highly sought after for user-facing AI product roles.

### Core User Flow

```
1. User lands on home page → selects a job role + interview type
2. User clicks "Start Interview" → mic permission requested
3. AI interviewer introduces itself and asks the first question (audio)
4. User answers verbally → audio streamed to backend → forwarded to Gemini
5. Gemini responds with follow-up/next question (audio streamed back)
6. After 5-8 questions or user clicks "End Interview"
7. Scorecard screen appears with structured performance feedback
```

---

## 2. Architecture

### High-Level Data Flow

```
┌─────────────┐    WebSocket     ┌──────────────┐   Gemini Live API   ┌─────────────┐
│   React      │◄──────────────►│   FastAPI      │◄──────────────────►│   Gemini     │
│   Frontend   │  PCM audio      │   Backend      │   PCM audio        │   2.5 Flash  │
│   (Browser)  │  + JSON msgs    │   (Python)     │   + text           │   Native     │
└─────────────┘                  └──────────────┘                      └─────────────┘
       │                                │
       │                                ▼
       │                         ┌──────────────┐
       │                         │  PostgreSQL   │
       │                         │  (Scorecards  │
       │                         │   + Sessions) │
       │                         └──────────────┘
       │
       ▼
  User's Mic & Speakers
```

### Why This Architecture?

- **Backend proxy pattern:** The Gemini Live API requires server-to-server authentication. API keys never reach the browser. The backend also lets us inject business logic (transcript accumulation, session management, scorecard generation).
- **WebSocket (not WebRTC):** Simpler to implement for a portfolio project. No STUN/TURN server overhead. Still achieves low-latency bidirectional streaming.
- **Native audio model:** `gemini-2.5-flash-native-audio-preview-12-2025` processes raw audio end-to-end in a single model — no separate STT → LLM → TTS pipeline. This dramatically reduces latency.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18+ with Vite, TypeScript | SPA with role selection, interview UI, scorecard display |
| **Audio Capture** | Web Audio API (`AudioContext`, `AudioWorkletProcessor`) | Capture mic, downsample to 16kHz 16-bit PCM, stream via WebSocket |
| **Audio Playback** | Web Audio API (`AudioContext`) | Buffer and play incoming 24kHz PCM audio from Gemini |
| **Transport** | WebSocket (native browser API ↔ FastAPI `WebSocket`) | Bidirectional binary + JSON messaging |
| **Backend** | Python 3.11+, FastAPI, uvicorn | WebSocket server, Gemini session management, transcript accumulation |
| **AI (Interview)** | Gemini Live API (`google-genai` Python SDK) | Real-time voice-to-voice conversation |
| **AI (Scorecard)** | Gemini Flash or Claude Haiku (standard REST API) | Post-interview evaluation from transcript |
| **Database** | PostgreSQL 16 | Store session metadata, transcripts, scorecards |
| **Infra** | Docker Compose, Proxmox homelab, Cloudflare Tunnels | Containerised deployment with secure remote access |

### Key Dependencies

```
# Backend (Python)
google-genai>=1.0.0        # Gemini SDK (includes Live API support)
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
websockets>=12.0
asyncpg>=0.29.0            # Async PostgreSQL driver
pydantic>=2.0
python-dotenv>=1.0.0
httpx>=0.27.0              # For scorecard API calls (Claude or Gemini REST)

# Frontend (Node/npm)
react@^18
react-dom@^18
typescript@^5
vite@^5
```

---

## 4. Gemini Live API — Key Technical Details

### Model & Configuration

```python
MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
```

### Session Setup (Python SDK)

```python
from google import genai
from google.genai import types

client = genai.Client()  # Uses GOOGLE_API_KEY env var

config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    system_instruction=types.Content(
        parts=[types.Part(text=INTERVIEWER_SYSTEM_PROMPT)]
    ),
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name="Kore"  # Professional-sounding voice
            )
        )
    ),
    input_audio_transcription=types.AudioTranscriptionConfig(),   # Transcribe user's speech
    output_audio_transcription=types.AudioTranscriptionConfig(),  # Transcribe model's speech
)

async with client.aio.live.connect(model=MODEL, config=config) as session:
    # Session is now open for bidirectional audio streaming
    pass
```

### Audio Format Requirements

| Direction | Format | Sample Rate | Bit Depth | Encoding |
|-----------|--------|------------|-----------|----------|
| **Input** (user → Gemini) | Raw PCM | 16,000 Hz | 16-bit | Little-endian, mono |
| **Output** (Gemini → user) | Raw PCM | 24,000 Hz | 16-bit | Little-endian, mono |

MIME type for input: `audio/pcm;rate=16000`

### Sending Audio to Gemini

```python
await session.send_realtime_input(
    audio=types.Blob(
        data=pcm_chunk_bytes,
        mime_type="audio/pcm;rate=16000"
    )
)
```

### Receiving Responses

```python
async for response in session.receive():
    server_content = response.server_content

    if server_content is None:
        continue

    # Audio data from the model
    if server_content.model_turn:
        for part in server_content.model_turn.parts:
            if part.inline_data:
                audio_bytes = part.inline_data.data
                # Forward audio_bytes to browser via WebSocket

    # Transcription of model's audio output
    if server_content.output_transcription:
        transcript_text = server_content.output_transcription.text
        # Accumulate for scorecard

    # Transcription of user's audio input
    if server_content.input_transcription:
        user_text = server_content.input_transcription.text
        # Accumulate for scorecard

    # Turn complete signal
    if server_content.turn_complete:
        # Model finished speaking, user can respond
        pass
```

### Voice Activity Detection (VAD)

Gemini has **built-in automatic VAD**. It detects when the user starts and stops speaking. You do NOT need to build silence detection. If the user interrupts the model while it's speaking, Gemini automatically handles the interruption.

### Session Constraints

- **Max session length:** 10 minutes (default). This is ideal for a mock interview round.
- **Audio token accumulation:** ~25 tokens/second of audio. For a 10-minute session this is ~15,000 tokens of audio alone.
- **Interruption support:** Built-in. When the user speaks over the model, the model stops and the server sends an `interrupted: true` signal.

---

## 5. System Prompt — Interviewer Persona

This is the most critical piece for interview quality. The system prompt is set once at session creation and persists for the entire session.

```python
INTERVIEWER_SYSTEM_PROMPT = """
You are a senior technical interviewer conducting a live mock interview.

## Your Role
- You are interviewing the candidate for the role of: {role_name}
- Interview type: {interview_type}  (e.g., "Behavioral", "Technical", "System Design", "Mixed")
- Your name is Alex. You work at a leading technology company.
- You are professional, encouraging but rigorous. You probe vague answers with follow-ups.

## Interview Structure
1. Begin with a brief, warm introduction (2-3 sentences). State your name and the role being interviewed for.
2. Ask exactly {num_questions} main questions, one at a time.
3. After each answer, acknowledge it briefly (1 sentence), then either:
   - Ask a targeted follow-up if the answer was vague, incomplete, or could be explored deeper
   - Move to the next main question if the answer was thorough
4. After all questions, thank the candidate and close the interview naturally.

## Question Bank Guidelines
- For BEHAVIORAL interviews: Use questions that probe leadership, conflict resolution, teamwork, and problem-solving. Expect structured answers (STAR/CARL format).
- For TECHNICAL interviews: Ask language-agnostic coding concepts, system design basics, debugging scenarios, and technology-specific questions relevant to {role_name}.
- For SYSTEM DESIGN interviews: Present a design problem, ask the candidate to think through requirements, high-level architecture, data model, scaling considerations.
- For MIXED interviews: Combine 2 behavioral + 2 technical + 1 situational question.

## Conversation Rules
- Ask ONE question at a time. Wait for the candidate to finish before responding.
- Keep your responses concise — this is a conversation, not a lecture.
- Do not provide answers to your own questions.
- If the candidate says "I don't know" or struggles, gently encourage them to think aloud, then move on after a reasonable attempt.
- Track which question number you're on internally. Reference it naturally (e.g., "Great, let's move to our next topic...").
- Never break character. You are always the interviewer.

## Tone
- Professional but warm
- Encouraging without being patronising
- Speak at a natural conversational pace
- Use natural filler words occasionally to sound human ("Right, okay...", "That's interesting...")

## Closing
After the final question, say something like: "That wraps up our questions for today. Thank you for your time — you did well. We'll have your feedback ready shortly."
"""
```

### Role Configuration Objects

```python
ROLE_CONFIGS = {
    "software_engineer": {
        "role_name": "Software Engineer",
        "interview_type": "Mixed",
        "num_questions": 6,
    },
    "frontend_developer": {
        "role_name": "Frontend Developer",
        "interview_type": "Technical",
        "num_questions": 5,
    },
    "product_manager": {
        "role_name": "Product Manager",
        "interview_type": "Behavioral",
        "num_questions": 6,
    },
    "data_scientist": {
        "role_name": "Data Scientist",
        "interview_type": "Mixed",
        "num_questions": 5,
    },
    "devops_engineer": {
        "role_name": "DevOps / Platform Engineer",
        "interview_type": "Technical",
        "num_questions": 5,
    },
    "engineering_manager": {
        "role_name": "Engineering Manager",
        "interview_type": "Behavioral",
        "num_questions": 6,
    },
}
```

---

## 6. Backend Implementation (FastAPI)

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, lifespan
│   ├── config.py               # Settings via pydantic-settings
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── interview.py        # WebSocket endpoint for interview sessions
│   │   └── scorecard.py        # REST endpoint for scorecard retrieval
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini_session.py   # Gemini Live API session manager
│   │   ├── transcript.py       # Transcript accumulator
│   │   └── evaluator.py        # Scorecard generation via LLM
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models for API contracts
│   └── db/
│       ├── __init__.py
│       ├── connection.py       # asyncpg pool
│       └── queries.py          # SQL queries for sessions/scorecards
├── requirements.txt
├── Dockerfile
└── .env.example
```

### WebSocket Protocol (Browser ↔ Backend)

Messages are either **binary** (raw PCM audio) or **JSON text** (control messages).

#### Client → Server Messages

| Type | Format | Description |
|------|--------|-------------|
| Audio chunk | Binary (ArrayBuffer) | Raw 16kHz 16-bit PCM audio from mic |
| Start session | JSON: `{"type": "start", "role_id": "software_engineer"}` | Initiates Gemini session with role config |
| End session | JSON: `{"type": "end"}` | Ends interview, triggers scorecard generation |

#### Server → Client Messages

| Type | Format | Description |
|------|--------|-------------|
| Audio chunk | Binary (ArrayBuffer) | Raw 24kHz 16-bit PCM audio from Gemini |
| Transcript update | JSON: `{"type": "transcript", "speaker": "interviewer"|"candidate", "text": "..."}` | Real-time transcript line |
| Turn complete | JSON: `{"type": "turn_complete"}` | Model finished speaking |
| Interview ended | JSON: `{"type": "interview_ended", "session_id": "..."}` | Confirms end, includes session ID for scorecard retrieval |
| Scorecard ready | JSON: `{"type": "scorecard_ready", "session_id": "..."}` | Scorecard generation complete |
| Error | JSON: `{"type": "error", "message": "..."}` | Error details |

### Core WebSocket Handler Logic (Pseudocode)

```python
@router.websocket("/ws/interview")
async def interview_websocket(websocket: WebSocket):
    await websocket.accept()
    transcript = TranscriptAccumulator()
    gemini_session = None

    try:
        while True:
            message = await websocket.receive()

            if "text" in message:
                data = json.loads(message["text"])

                if data["type"] == "start":
                    role_config = ROLE_CONFIGS[data["role_id"]]
                    system_prompt = build_system_prompt(role_config)
                    gemini_session = await create_gemini_session(system_prompt)

                    # Start background task to relay Gemini responses to browser
                    asyncio.create_task(
                        relay_gemini_to_browser(gemini_session, websocket, transcript)
                    )

                elif data["type"] == "end":
                    if gemini_session:
                        # Close Gemini session
                        # Generate scorecard from transcript
                        scorecard = await generate_scorecard(transcript)
                        await save_scorecard(session_id, scorecard)
                        await websocket.send_json({
                            "type": "scorecard_ready",
                            "session_id": session_id,
                            "scorecard": scorecard
                        })
                    break

            elif "bytes" in message:
                # Raw PCM audio from browser microphone
                if gemini_session:
                    await gemini_session.send_realtime_input(
                        audio=types.Blob(
                            data=message["bytes"],
                            mime_type="audio/pcm;rate=16000"
                        )
                    )

    except WebSocketDisconnect:
        pass
    finally:
        if gemini_session:
            # Cleanup Gemini session
            pass
```

### Relay Task (Gemini → Browser)

```python
async def relay_gemini_to_browser(session, websocket, transcript):
    async for response in session.receive():
        sc = response.server_content
        if sc is None:
            continue

        if sc.model_turn:
            for part in sc.model_turn.parts:
                if part.inline_data:
                    # Send raw audio bytes to browser
                    await websocket.send_bytes(part.inline_data.data)

        if sc.output_transcription and sc.output_transcription.text:
            transcript.add("interviewer", sc.output_transcription.text)
            await websocket.send_json({
                "type": "transcript",
                "speaker": "interviewer",
                "text": sc.output_transcription.text
            })

        if sc.input_transcription and sc.input_transcription.text:
            transcript.add("candidate", sc.input_transcription.text)
            await websocket.send_json({
                "type": "transcript",
                "speaker": "candidate",
                "text": sc.input_transcription.text
            })

        if sc.turn_complete:
            await websocket.send_json({"type": "turn_complete"})
```

---

## 7. Frontend Implementation (React + Vite + TypeScript)

### Project Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── HomePage.tsx            # Role selection
│   │   ├── InterviewPage.tsx       # Live interview UI
│   │   └── ScorecardPage.tsx       # Results display
│   ├── components/
│   │   ├── RoleCard.tsx            # Selectable role option
│   │   ├── AudioVisualizer.tsx     # Pulsing dot / waveform indicator
│   │   ├── TranscriptPanel.tsx     # Live scrolling transcript
│   │   ├── Timer.tsx               # Interview duration counter
│   │   └── ScorecardDisplay.tsx    # Structured feedback render
│   ├── hooks/
│   │   ├── useWebSocket.ts         # WebSocket connection management
│   │   ├── useAudioCapture.ts      # Mic capture + PCM conversion
│   │   └── useAudioPlayback.ts     # PCM playback via AudioContext
│   ├── audio/
│   │   └── pcm-worklet-processor.ts  # AudioWorkletProcessor for PCM conversion
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       └── constants.ts            # Role configs, WS URL, etc.
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

### Audio Capture — AudioWorklet (Critical Component)

The browser mic captures audio at 48kHz Float32. Gemini needs 16kHz Int16 PCM. This conversion must happen in an AudioWorklet to avoid blocking the main thread.

```typescript
// src/audio/pcm-worklet-processor.ts
// This file must be loaded as a separate module by AudioWorkletNode

class PCMWorkletProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array[] = [];
  private readonly inputSampleRate = 48000; // Typical browser default
  private readonly outputSampleRate = 16000;
  private readonly ratio = this.inputSampleRate / this.outputSampleRate; // 3

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // Mono channel

    // Simple downsample by picking every Nth sample
    const downsampledLength = Math.floor(channelData.length / this.ratio);
    const downsampled = new Float32Array(downsampledLength);
    for (let i = 0; i < downsampledLength; i++) {
      downsampled[i] = channelData[Math.round(i * this.ratio)];
    }

    // Convert Float32 [-1, 1] to Int16
    const pcm16 = new Int16Array(downsampled.length);
    for (let i = 0; i < downsampled.length; i++) {
      const s = Math.max(-1, Math.min(1, downsampled[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Send PCM bytes to main thread
    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);

    return true;
  }
}

registerProcessor('pcm-worklet-processor', PCMWorkletProcessor);
```

### Audio Capture Hook

```typescript
// src/hooks/useAudioCapture.ts
import { useRef, useCallback } from 'react';

export function useAudioCapture(onAudioChunk: (data: ArrayBuffer) => void) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });
    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule('/pcm-worklet-processor.js');

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-worklet-processor');
    workletNodeRef.current = workletNode;

    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      onAudioChunk(event.data);
    };

    source.connect(workletNode);
    // Don't connect to destination — we don't want to play mic audio back
  }, [onAudioChunk]);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  return { start, stop };
}
```

### Audio Playback Hook

```typescript
// src/hooks/useAudioPlayback.ts
import { useRef, useCallback } from 'react';

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const init = useCallback(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;
  }, []);

  const playChunk = useCallback((pcmData: ArrayBuffer) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Convert Int16 PCM to Float32 for Web Audio API
    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Schedule chunks sequentially to avoid gaps
    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  }, []);

  const stop = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    nextStartTimeRef.current = 0;
  }, []);

  return { init, playChunk, stop };
}
```

### WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
import { useRef, useCallback, useState } from 'react';

interface WSMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(
  onAudioReceived: (data: ArrayBuffer) => void,
  onJsonMessage: (msg: WSMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback((url: string) => {
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = (e) => console.error('WebSocket error:', e);

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary = audio data from Gemini
        onAudioReceived(event.data);
      } else {
        // Text = JSON control message
        const msg = JSON.parse(event.data);
        onJsonMessage(msg);
      }
    };

    wsRef.current = ws;
  }, [onAudioReceived, onJsonMessage]);

  const sendAudio = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const sendJson = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  return { connect, sendAudio, sendJson, disconnect, isConnected };
}
```

### UI Pages

#### Home Page
- Grid of role cards (icon, title, description, interview type badge)
- "Custom Role" option with text input
- Clicking a card navigates to `/interview/:roleId`

#### Interview Page
- **Top bar:** Role name, timer (counting up), "End Interview" button (red)
- **Center:** Large animated audio visualizer showing who's currently speaking
- **Bottom panel:** Live transcript (auto-scrolling, speaker labels colour-coded)
- **States:** `connecting` → `active` → `ending` → `complete`

#### Scorecard Page
- Overall score (1-10) with circular progress indicator
- Category scores: Communication, Technical Depth, Structure, Confidence, Relevance
- Per-answer breakdown with the question, a summary of the answer, and specific feedback
- "Try Again" and "Download PDF" buttons

---

## 8. Scorecard Generation

When the interview ends, the accumulated transcript (from Gemini's built-in transcription) is sent to a standard LLM API call for structured evaluation.

### Evaluation Prompt

```python
SCORECARD_PROMPT = """
You are an expert interview coach. Analyse the following mock interview transcript and produce a structured evaluation.

## Interview Context
- Role: {role_name}
- Interview Type: {interview_type}
- Number of Questions: {num_questions}

## Transcript
{transcript}

## Required Output (JSON)
Return ONLY valid JSON with this exact structure:

{{
  "overall_score": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": {{
    "communication_clarity": {{
      "score": <number 1-10>,
      "feedback": "<specific feedback with examples from transcript>"
    }},
    "technical_depth": {{
      "score": <number 1-10>,
      "feedback": "<specific feedback>"
    }},
    "answer_structure": {{
      "score": <number 1-10>,
      "feedback": "<did they use STAR/CARL? Were answers organized?>"
    }},
    "confidence_delivery": {{
      "score": <number 1-10>,
      "feedback": "<filler words, hesitation, assertiveness>"
    }},
    "relevance_specificity": {{
      "score": <number 1-10>,
      "feedback": "<did they answer what was asked? Specific examples?>"
    }}
  }},
  "per_question": [
    {{
      "question": "<the interviewer's question>",
      "answer_summary": "<brief summary of candidate's answer>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"],
      "score": <number 1-10>
    }}
  ],
  "top_tips": [
    "<actionable tip 1>",
    "<actionable tip 2>",
    "<actionable tip 3>"
  ]
}}
"""
```

### Scorecard Generation Service

```python
# Using Gemini Flash for cost efficiency
async def generate_scorecard(transcript: TranscriptAccumulator, role_config: dict) -> dict:
    prompt = SCORECARD_PROMPT.format(
        role_name=role_config["role_name"],
        interview_type=role_config["interview_type"],
        num_questions=role_config["num_questions"],
        transcript=transcript.to_formatted_string()
    )

    # Use standard (non-live) Gemini API for text generation
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.3
        )
    )

    return json.loads(response.text)
```

---

## 9. Database Schema

```sql
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    interview_type VARCHAR(30) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'active'  -- active, completed, abandoned
);

CREATE TABLE transcript_entries (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL,  -- 'interviewer' or 'candidate'
    content TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,  -- ms from session start
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score NUMERIC(3,1),
    scorecard_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_transcript_session ON transcript_entries(session_id);
```

---

## 10. Docker Compose Configuration

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mock_interviewer
      POSTGRES_USER: interviewer
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U interviewer -d mock_interviewer"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

---

## 11. Implementation Phases

### Phase 1 — Audio Pipeline Proof of Concept (Weekend 1)

**Goal:** Get voice-to-voice working end-to-end with a hardcoded prompt.

1. Set up a minimal FastAPI server with one WebSocket endpoint
2. On "start" message, open a Gemini Live session with a simple system prompt ("You are a friendly interviewer. Ask the user to tell you about themselves.")
3. Relay binary audio bidirectionally (browser ↔ FastAPI ↔ Gemini)
4. Build a minimal React page: "Start" button, mic capture with AudioWorklet, PCM playback
5. Test: click start, speak, hear Gemini respond

**Validation:** You can have a spoken conversation through the browser.

### Phase 2 — Interview Flow (Weekend 2)

**Goal:** Complete interview session with role selection and structured prompting.

1. Build role selection page with 4-6 role cards
2. Implement the full interviewer system prompt with role config injection
3. Add transcript accumulation using Gemini's built-in transcription
4. Add live transcript panel in the interview UI
5. Implement "End Interview" flow
6. Add timer component

**Validation:** You can select "Software Engineer", have a 5-question interview, and see the transcript.

### Phase 3 — Scorecard (Weekend 3)

**Goal:** Generate and display structured performance feedback.

1. Build the scorecard evaluation service (Gemini Flash REST call)
2. Design and build the scorecard display page
3. Set up PostgreSQL, persist sessions and scorecards
4. Add "loading" state while scorecard generates
5. Add "Try Again" navigation

**Validation:** After ending an interview, a detailed scorecard appears with per-question feedback.

### Phase 4 — Polish & Deploy (Weekend 4)

**Goal:** Production-ready portfolio piece.

1. Audio visualiser (animated waveform or pulsing indicator)
2. Error handling: mic permission denied, WebSocket disconnect, Gemini errors
3. Responsive design (works on mobile with headphones)
4. Dockerise everything
5. Deploy to Proxmox homelab with Cloudflare Tunnel
6. Record a demo video for portfolio

---

## 12. Environment Variables

```bash
# backend/.env.example

# Gemini
GOOGLE_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=postgresql+asyncpg://interviewer:password@db:5432/mock_interviewer

# App
CORS_ORIGINS=http://localhost:3000,https://interviewer.yourdomain.com
WEBSOCKET_URL=ws://localhost:8000/ws/interview

# Optional: Claude for scorecard (alternative to Gemini)
# ANTHROPIC_API_KEY=your_claude_api_key_here
```

---

## 13. Key Gotchas & Tips

### Audio

- **Browser AudioContext requires user gesture:** You must create/resume the AudioContext inside a click handler (the "Start Interview" button). Browsers block autoplay.
- **Echo cancellation:** Enable `echoCancellation: true` in `getUserMedia` constraints. Without this, Gemini will hear its own output and create feedback loops.
- **Chunk size:** Send audio in chunks of 20-40ms for optimal latency. At 16kHz 16-bit mono, 40ms = 1,280 bytes.
- **Playback scheduling:** Use `AudioBufferSourceNode.start(scheduledTime)` with sequential scheduling to avoid gaps between chunks. Never use `start(0)` for every chunk.

### WebSocket

- **Binary vs text:** Use `ws.binaryType = 'arraybuffer'` on the client. Check `isinstance(message, bytes)` on the server. Don't mix — audio is always binary, control messages are always JSON text.
- **Backpressure:** If audio chunks arrive faster than you can send them, drop oldest chunks rather than queuing indefinitely.

### Gemini Live API

- **One session per connection:** Each `client.aio.live.connect()` creates one session. Don't try to reuse sessions across interviews.
- **System instruction immutability:** The system prompt cannot be changed after session creation. To switch roles, you must create a new session.
- **Transcription timing:** Transcription events may arrive slightly after their corresponding audio. Don't rely on strict ordering between audio and transcript events.

### Deployment

- **Cloudflare Tunnel + WebSocket:** Cloudflare supports WebSocket proxying. Ensure your tunnel is configured for the backend port. The frontend can use `wss://` through the tunnel.
- **CORS:** FastAPI CORS middleware must allow your frontend origin. WebSocket connections don't use CORS (they use the Origin header in the handshake), but your REST endpoints do.

---

## 14. Stretch Goals (Post-MVP)

- [ ] **Session replay:** Record full audio for playback after interview
- [ ] **PDF scorecard export:** Generate a downloadable PDF report
- [ ] **Custom question bank:** Let users upload their own questions
- [ ] **Video mode:** Add webcam stream for body language analysis (Gemini supports video input)
- [ ] **Authentication:** User accounts with interview history tracking
- [ ] **A/B voice selection:** Let users pick the interviewer voice
- [ ] **Difficulty levels:** Adjust follow-up aggressiveness and question complexity

---

## 15. File Reference Quick Links

| Resource | URL |
|----------|-----|
| Gemini Live API Docs | https://ai.google.dev/gemini-api/docs/live |
| Gemini Live API Capabilities | https://ai.google.dev/gemini-api/docs/live-guide |
| Gemini Live API Best Practices | https://ai.google.dev/gemini-api/docs/live-api/best-practices |
| Google GenAI SDK (Python) | https://pypi.org/project/google-genai/ |
| Gemini Live API Examples (GitHub) | https://github.com/google-gemini/gemini-live-api-examples |
| Web Audio API (MDN) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API |
| AudioWorklet (MDN) | https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet |
| FastAPI WebSockets | https://fastapi.tiangolo.com/advanced/websockets/ |

---

*Last updated: March 2026*
*Target model: gemini-2.5-flash-native-audio-preview-12-2025*
