# backend/app/routers/interview.py
import json
import asyncio
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types
from app.services.gemini_session import GeminiSessionManager
from app.services.evaluator import EvaluatorService
from app.db import queries

router = APIRouter()
session_manager = GeminiSessionManager()
evaluator = EvaluatorService()

@router.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    await websocket.accept()
    transcript_history = []
    session_id = None
    start_time = time.time()
    
    try:
        # Wait for the first message (should be a "start" message)
        message = await websocket.receive()
        if "text" in message:
            data = json.loads(message["text"])
            if data["type"] == "start":
                role_id = data.get("role_id", "software_engineer")
                role_name = data.get("role_name", "Software Engineer")
                interview_type = data.get("interview_type", "Technical")
                
                # Create DB session
                try:
                    session_id = await queries.create_session(role_id, role_name, interview_type)
                except Exception as e:
                    print(f"DB Error creating session: {e}")

                system_prompt = f"You are a senior technical interviewer for a {role_name} position. Ask exactly 5 main questions."
                
                # Correctly enter the async context manager
                async with await session_manager.connect(system_prompt) as session:
                    # Start the relay task
                    relay_task = asyncio.create_task(relay_gemini_to_browser(session, websocket, transcript_history, session_id, start_time))
                    
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
                    
                    # Generate and save scorecard
                    full_transcript = "\n".join([f"{t['speaker']}: {t['text']}" for t in transcript_history])
                    if full_transcript:
                        scorecard = await evaluator.generate_scorecard(full_transcript)
                        
                        if session_id:
                            try:
                                overall_score = scorecard.get("overall_score", 0)
                                await queries.save_scorecard(session_id, overall_score, scorecard)
                            except Exception as e:
                                print(f"DB Error saving scorecard: {e}")
                        
                        await websocket.send_json({"type": "scorecard", "data": scorecard})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")

async def relay_gemini_to_browser(session, websocket, transcript_history, session_id, start_time):
    # session should be the LiveSession object.
    async for response in session.receive():
        sc = response.server_content
        if sc and sc.model_turn:
            for part in sc.model_turn.parts:
                if part.inline_data:
                    await websocket.send_bytes(part.inline_data.data)
        
        if sc and sc.output_transcription:
            text = sc.output_transcription.text
            ts = int((time.time() - start_time) * 1000)
            transcript_history.append({"speaker": "interviewer", "text": text, "timestamp": ts})
            
            if session_id:
                asyncio.create_task(queries.record_transcript(session_id, "interviewer", text, ts))
                
            await websocket.send_json({"type": "transcript", "speaker": "interviewer", "text": text})
            
        if sc and sc.input_transcription:
            text = sc.input_transcription.text
            ts = int((time.time() - start_time) * 1000)
            transcript_history.append({"speaker": "candidate", "text": text, "timestamp": ts})
            
            if session_id:
                asyncio.create_task(queries.record_transcript(session_id, "candidate", text, ts))
                
            await websocket.send_json({"type": "transcript", "speaker": "candidate", "text": text})
            
        if sc and sc.turn_complete:
            await websocket.send_json({"type": "turn_complete"})
