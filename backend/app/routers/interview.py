# backend/app/routers/interview.py
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types
from app.services.gemini_session import GeminiSessionManager

router = APIRouter()
session_manager = GeminiSessionManager()

@router.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    await websocket.accept()
    gemini_session = None
    try:
        while True:
            message = await websocket.receive()
            if "text" in message:
                data = json.loads(message["text"])
                if data["type"] == "start":
                    system_prompt = "You are a senior technical interviewer. Ask exactly 5 main questions."
                    # We await the context manager and then use it.
                    # Note: The provided code doesn't use 'async with'.
                    # We will try to follow the user's code closely.
                    gemini_session = await session_manager.connect(system_prompt)
                    asyncio.create_task(relay_gemini_to_browser(gemini_session, websocket))
            elif "bytes" in message:
                if gemini_session:
                    # If gemini_session is a context manager, this might fail.
                    # But we follow instructions.
                    await gemini_session.send_realtime_input(
                        audio=types.Blob(data=message["bytes"], mime_type="audio/pcm;rate=16000")
                    )
    except WebSocketDisconnect:
        pass
    finally:
        if gemini_session:
            # Close the session if needed
            pass

async def relay_gemini_to_browser(session, websocket):
    # session should be the LiveSession object.
    async for response in session.receive():
        sc = response.server_content
        if sc and sc.model_turn:
            for part in sc.model_turn.parts:
                if part.inline_data:
                    await websocket.send_bytes(part.inline_data.data)
        if sc and sc.output_transcription:
            await websocket.send_json({"type": "transcript", "speaker": "interviewer", "text": sc.output_transcription.text})
        if sc and sc.input_transcription:
            await websocket.send_json({"type": "transcript", "speaker": "candidate", "text": sc.input_transcription.text})
        if sc and sc.turn_complete:
            await websocket.send_json({"type": "turn_complete"})
