# backend/app/routers/interview.py
import json
import asyncio
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types
from app.services.gemini_session import GeminiSessionManager
from app.services.evaluator import EvaluatorService
from app.services.session_store import session_store
from app.utils.prompts import INTERVIEWER_SYSTEM_PROMPT, ROLE_CONFIGS

router = APIRouter()
session_manager = GeminiSessionManager()
evaluator = EvaluatorService()

@router.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    await websocket.accept()
    session_id = None
    session_data = None
    
    try:
        # Wait for the first message (should be "start" or "reconnect")
        message = await websocket.receive()
        if "text" in message:
            data = json.loads(message["text"])
            
            if data["type"] == "reconnect":
                session_id = data.get("session_id")
                session_data = session_store.get(session_id)
                if session_data:
                    # Update the websocket in the relay task if necessary
                    session_data["websocket"] = websocket
                    # Restore transcript history
                    await websocket.send_json({
                        "type": "history", 
                        "history": session_data["transcript_history"]
                    })
                else:
                    # Session not found, start a new one
                    data["type"] = "start"

            if data["type"] == "start":
                session_id = str(uuid.uuid4())
                role_id = data.get("role_id", "software_engineer")
                role_config = ROLE_CONFIGS.get(role_id, ROLE_CONFIGS["software_engineer"])
                system_prompt = INTERVIEWER_SYSTEM_PROMPT.format(**role_config)
                
                # Connect to Gemini
                genai_session = await session_manager.connect(system_prompt)
                live_session = await genai_session.__aenter__()
                
                transcript_history = []
                session_data = {
                    "session_id": session_id,
                    "live_session": live_session,
                    "genai_session": genai_session,
                    "transcript_history": transcript_history,
                    "websocket": websocket,
                    "relay_task": None,
                    "completed": False
                }
                session_store.save(session_id, session_data)
                await websocket.send_json({"type": "session_id", "session_id": session_id})
                
                # Start relay task
                relay_task = asyncio.create_task(relay_gemini_to_browser(session_id))
                session_data["relay_task"] = relay_task

            if not session_data:
                await websocket.close(code=1000)
                return

            # Main WebSocket loop
            live_session = session_data["live_session"]
            while True:
                try:
                    message = await websocket.receive()
                except WebSocketDisconnect:
                    break

                if "bytes" in message:
                    await live_session.send_realtime_input(
                        audio=types.Blob(data=message["bytes"], mime_type="audio/pcm;rate=16000")
                    )
                elif "text" in message:
                    data = json.loads(message["text"])
                    if data["type"] == "end":
                        # Mark as completed
                        session_data["completed"] = True
                        # Generate scorecard and then cleanup
                        full_transcript = "\n".join([f"{t['speaker']}: {t['text']}" for t in session_data["transcript_history"]])
                        if full_transcript:
                            scorecard = await evaluator.generate_scorecard(full_transcript)
                            try:
                                await websocket.send_json({"type": "scorecard", "data": scorecard})
                            except: pass
                        session_store.delete(session_id)
                        break
    
    except WebSocketDisconnect:
        # Don't delete the session on disconnect to allow reconnection
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        pass

async def relay_gemini_to_browser(session_id: str):
    session_data = session_store.get(session_id)
    if not session_data:
        return
        
    live_session = session_data["live_session"]
    genai_session = session_data["genai_session"]
    transcript_history = session_data["transcript_history"]
    
    try:
        async for response in live_session.receive():
            # Refresh session_data to get the latest websocket (might have reconnected)
            session_data = session_store.get(session_id)
            if not session_data:
                # Session was deleted (likely an "end" message)
                break
            
            websocket = session_data["websocket"]
            sc = response.server_content
            
            if sc and sc.model_turn:
                for part in sc.model_turn.parts:
                    if part.inline_data:
                        try:
                            await websocket.send_bytes(part.inline_data.data)
                        except: pass # Socket might be closed during reconnection
            
            if sc and sc.output_transcription:
                text = sc.output_transcription.text
                transcript_history.append({"speaker": "interviewer", "text": text})
                try:
                    await websocket.send_json({"type": "transcript", "speaker": "interviewer", "text": text})
                except: pass
                
            if sc and sc.input_transcription:
                text = sc.input_transcription.text
                transcript_history.append({"speaker": "candidate", "text": text})
                try:
                    await websocket.send_json({"type": "transcript", "speaker": "candidate", "text": text})
                except: pass
                
            if sc and sc.turn_complete:
                try:
                    await websocket.send_json({"type": "turn_complete"})
                except: pass
                
    except Exception as e:
        print(f"Relay error for {session_id}: {e}")
    finally:
        # Ensure session is closed
        await genai_session.__aexit__(None, None, None)
        
        session_data = session_store.get(session_id)
        if session_data and not session_data.get("completed"):
            session_data["completed"] = True
            full_transcript = "\n".join([f"{t['speaker']}: {t['text']}" for t in transcript_history])
            if full_transcript:
                scorecard = await evaluator.generate_scorecard(full_transcript)
                try:
                    await session_data["websocket"].send_json({"type": "scorecard", "data": scorecard})
                except: pass
            session_store.delete(session_id)
