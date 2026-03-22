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
    try:
        # Wait for the first message (should be a "start" message)
        message = await websocket.receive()
        if "text" in message:
            data = json.loads(message["text"])
            if data["type"] == "start":
                system_prompt = "You are a senior technical interviewer. Ask exactly 5 main questions."
                # Correctly enter the async context manager
                async with await session_manager.connect(system_prompt) as session:
                    # Start the relay task
                    relay_task = asyncio.create_task(relay_gemini_to_browser(session, websocket))
                    
                    # Continue the WebSocket loop for binary audio and additional messages
                    while True:
                        try:
                            message = await websocket.receive()
                        except WebSocketDisconnect:
                            break

                        if "bytes" in message:
                            await session.send_realtime_input(
                                audio=types.Blob(data=message["bytes"], mime_type="audio/pcm;rate=16000")
                            )
                        elif "text" in message:
                            data = json.loads(message["text"])
                            if data["type"] == "end":
                                break
                    
                    # Cancel the relay task when the loop ends
                    relay_task.cancel()
                    try:
                        await relay_task
                    except asyncio.CancelledError:
                        pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")

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
