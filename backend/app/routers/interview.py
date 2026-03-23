# backend/app/routers/interview.py
import json
import asyncio
import uuid
import time
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types
from app.services.gemini_session import GeminiSessionManager
from app.services.evaluator import EvaluatorService
from app.services.session_store import session_store
from app.utils.prompts import INTERVIEWER_SYSTEM_PROMPT, ROLE_CONFIGS, DIFFICULTY_CONFIGS
from app.db import queries

router = APIRouter()
session_manager = GeminiSessionManager()
evaluator = EvaluatorService()
logger = logging.getLogger(__name__)

@router.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")
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
                    logger.info(f"Session reconnected: {session_id}")
                    # Update the websocket in the relay task if necessary
                    session_data["websocket"] = websocket
                    # Restore transcript history
                    await websocket.send_json({
                        "type": "history", 
                        "history": session_data["transcript_history"]
                    })
                else:
                    logger.info(f"Reconnect failed, session not found: {session_id}")
                    # Session not found, start a new one
                    data["type"] = "start"

            if data["type"] == "start":
                session_id = str(uuid.uuid4())
                logger.info(f"Starting new session: {session_id}")
                role_id = data.get("role_id", "software_engineer")
                difficulty = data.get("difficulty", "Medium")
                job_description = data.get("job_description")
                
                role_config = ROLE_CONFIGS.get(role_id, ROLE_CONFIGS["software_engineer"])
                diff_config = DIFFICULTY_CONFIGS.get(difficulty, DIFFICULTY_CONFIGS["Medium"])
                
                # Combine role and difficulty configurations
                combined_config = {**role_config, **diff_config}
                system_prompt = INTERVIEWER_SYSTEM_PROMPT.format(**combined_config)

                if job_description:
                    system_prompt += f"\n\nContext: Use this JD for specific requirements: {job_description}"
                
                # Create DB session
                db_session_id = None
                try:
                    db_session_id = await queries.create_session(
                        role_id, 
                        role_config["role_name"], 
                        role_config["interview_type"]
                    )
                except Exception as e:
                    logger.error(f"DB Error creating session: {e}")

                # Connect to Gemini
                genai_session = await session_manager.connect(system_prompt)
                live_session = await genai_session.__aenter__()
                
                transcript_history = []
                session_data = {
                    "session_id": session_id,
                    "db_session_id": db_session_id,
                    "live_session": live_session,
                    "genai_session": genai_session,
                    "transcript_history": transcript_history,
                    "job_description": job_description,
                    "websocket": websocket,
                    "relay_task": None,
                    "completed": False,
                    "start_time": time.time()
                }
                session_store.save(session_id, session_data)
                await websocket.send_json({"type": "session_id", "session_id": session_id})
                
                # Start relay task
                relay_task = asyncio.create_task(relay_gemini_to_browser(session_id))
                session_data["relay_task"] = relay_task

            if not session_data:
                logger.warning("Session data missing, closing connection")
                await websocket.close(code=1000)
                return

            # Main WebSocket loop
            live_session = session_data["live_session"]
            while True:
                try:
                    message = await websocket.receive()
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected for session: {session_id}")
                    break

                if "bytes" in message:
                    await live_session.send_realtime_input(
                        audio=types.Blob(data=message["bytes"], mime_type="audio/pcm;rate=16000")
                    )
                elif "text" in message:
                    data = json.loads(message["text"])
                    if data["type"] == "end":
                        logger.info(f"Session ended by user: {session_id}")
                        # Mark as completed
                        session_data["completed"] = True
                        
                        # Generate scorecard
                        full_transcript = "\n".join([f"{t['speaker']}: {t['text']}" for t in session_data["transcript_history"]])
                        if full_transcript:
                            scorecard = await evaluator.generate_scorecard(full_transcript, session_data.get("job_description"))
                            
                            # Save scorecard to DB
                            if session_data.get("db_session_id"):
                                try:
                                    overall_score = scorecard.get("overall_score", 0)
                                    await queries.save_scorecard(session_data["db_session_id"], overall_score, scorecard)
                                except Exception as e:
                                    logger.error(f"DB Error saving scorecard: {e}")
                            
                            try:
                                await websocket.send_json({"type": "scorecard", "data": scorecard})
                            except: pass
                        
                        session_store.delete(session_id)
                        break
                    elif data["type"] == "interrupted":
                        # Handle interruption if needed by the session manager
                        pass
    
    except WebSocketDisconnect:
        # Don't delete the session on disconnect to allow reconnection
        logger.info(f"WebSocket disconnected (handled): {session_id}")
        pass
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}", exc_info=True)
    finally:
        pass

async def relay_gemini_to_browser(session_id: str):
    session_data = session_store.get(session_id)
    if not session_data:
        logger.error(f"Relay task could not find session: {session_id}")
        return
        
    live_session = session_data["live_session"]
    genai_session = session_data["genai_session"]
    transcript_history = session_data["transcript_history"]
    db_session_id = session_data.get("db_session_id")
    start_time = session_data["start_time"]
    
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
                ts = int((time.time() - start_time) * 1000)
                transcript_history.append({"speaker": "interviewer", "text": text, "timestamp": ts})
                
                if db_session_id:
                    asyncio.create_task(queries.record_transcript(db_session_id, "interviewer", text, ts))
                
                try:
                    await websocket.send_json({"type": "transcript", "speaker": "interviewer", "text": text})
                except: pass
                
            if sc and sc.input_transcription:
                text = sc.input_transcription.text
                ts = int((time.time() - start_time) * 1000)
                transcript_history.append({"speaker": "candidate", "text": text, "timestamp": ts})
                
                if db_session_id:
                    asyncio.create_task(queries.record_transcript(db_session_id, "candidate", text, ts))
                
                try:
                    await websocket.send_json({"type": "transcript", "speaker": "candidate", "text": text})
                except: pass
                
            if sc and sc.turn_complete:
                try:
                    await websocket.send_json({"type": "turn_complete"})
                except: pass
                
    except Exception as e:
        logger.error(f"Relay error for {session_id}: {e}", exc_info=True)
    finally:
        # Ensure session is closed
        await genai_session.__aexit__(None, None, None)
        
        session_data = session_store.get(session_id)
        if session_data and not session_data.get("completed"):
            logger.info(f"Completing session in relay cleanup: {session_id}")
            session_data["completed"] = True
            full_transcript = "\n".join([f"{t['speaker']}: {t['text']}" for t in transcript_history])
            if full_transcript:
                scorecard = await evaluator.generate_scorecard(full_transcript, session_data.get("job_description"))
                
                # Save scorecard to DB
                if session_data.get("db_session_id"):
                    try:
                        overall_score = scorecard.get("overall_score", 0)
                        await queries.save_scorecard(session_data["db_session_id"], overall_score, scorecard)
                    except Exception as e:
                        logger.error(f"DB Error saving scorecard: {e}")
                
                try:
                    await session_data["websocket"].send_json({"type": "scorecard", "data": scorecard})
                except: pass
            session_store.delete(session_id)

