# backend/app/routers/interview.py
import json
import asyncio
import uuid
import time
import logging
from jose import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types
from app.services.gemini_session import GeminiSessionManager
from app.services.evaluator import EvaluatorService
from app.services.session_store import session_store
from app.config import settings
from app.utils.prompts import INTERVIEWER_SYSTEM_PROMPT, ROLE_CONFIGS, DIFFICULTY_CONFIGS
from app.db import queries
from app.services.auth import SECRET_KEY, ALGORITHM

router = APIRouter()
session_manager = GeminiSessionManager()
evaluator = EvaluatorService()
logger = logging.getLogger(__name__)

@router.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    await websocket.accept()
    
    # DEBUG: Verify key at the start of every connection
    key = settings.GOOGLE_API_KEY
    masked_key = f"{key[:6]}...{key[-4:]}" if key else "MISSING"
    logger.info(f"WebSocket connection established. Using API Key: {masked_key}")
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
                token = data.get("token")
                
                user_id = None
                if token:
                    try:
                        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                        user_id = payload.get("sub")
                    except jwt.JWTError:
                        logger.warning("Invalid or expired token received for WebSocket connection.")
                
                role_config = ROLE_CONFIGS.get(role_id, ROLE_CONFIGS["software_engineer"])
                diff_config = DIFFICULTY_CONFIGS.get(difficulty, DIFFICULTY_CONFIGS["Medium"])
                
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
                        role_config["interview_type"],
                        user_id
                    )
                except Exception as e:
                    logger.error(f"DB Error creating session: {e}")

                # Connect to Gemini
                try:
                    logger.info(f"Attempting to connect to Gemini model: {session_manager.model}")
                    genai_session = await session_manager.connect(system_prompt)
                    # We enter the context here but the relay task will manage it
                    live_session = await genai_session.__aenter__()
                    logger.info("Successfully connected to Gemini Live session")
                except Exception as genai_err:
                    logger.error(f"Gemini Connection Error: {genai_err}", exc_info=True)
                    await websocket.send_json({"type": "error", "message": str(genai_err)})
                    await websocket.close(code=1011)
                    return
                
                session_data = {
                    "session_id": session_id,
                    "db_session_id": db_session_id,
                    "live_session": live_session,
                    "genai_session": genai_session,
                    "transcript_history": [],
                    "job_description": job_description,
                    "websocket": websocket,
                    "relay_task": None,
                    "completed": False,
                    "start_time": time.time()
                }
                session_store.save(session_id, session_data)
                await websocket.send_json({"type": "session_id", "session_id": session_id})
                
                # Start relay task - this task now OWNS the session lifecycle
                relay_task = asyncio.create_task(relay_gemini_to_browser(session_id))
                session_data["relay_task"] = relay_task

                # Force the AI to start speaking immediately
                logger.info("Sending initial prompt to trigger AI greeting...")
                await live_session.send(input="Hello, I am ready for my interview.")

            if not session_data:
                logger.warning("Session data missing, closing connection")
                await websocket.close(code=1000)
                return

            # Main WebSocket loop - just relays input
            while True:
                try:
                    message = await websocket.receive()
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected for session: {session_id}")
                    # Update session data to reflect missing websocket
                    if session_data:
                        session_data["websocket"] = None
                    break

                if "bytes" in message:
                    try:
                        await session_data["live_session"].send_realtime_input(
                            audio=types.Blob(data=message["bytes"], mime_type="audio/pcm;rate=16000")
                        )
                    except Exception as e:
                        logger.warning(f"Failed to send realtime input (session may be closed): {e}")
                        break # Break the websocket loop if we can't send to Gemini
                elif "text" in message:
                    data = json.loads(message["text"])
                    if data["type"] == "end":
                        logger.info(f"Session ended by user: {session_id}")
                        session_data["completed"] = True
                        break
                    elif data["type"] == "interrupted":
                        logger.info(f"Frontend sent 'interrupted' signal for session: {session_id}")
                        pass
                    elif data["type"] == "client_turn_complete":
                        logger.info(f"Frontend sent 'client_turn_complete' for session: {session_id}")
                        try:
                            await session_data["live_session"].send(input={"parts": []}, end_of_turn=True)
                        except Exception as e:
                            logger.error(f"Failed to send end_of_turn to Gemini: {e}")
    
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
    
    logger.info(f"Relay task started for session: {session_id}")
    
    try:
        while True:
            async for response in live_session.receive():
                # IMPORTANT: Do not break the loop if websocket is temporarily missing
                # during a reconnection event.
                session_data = session_store.get(session_id)
                if not session_data:
                    logger.info(f"Relay loop: session_id {session_id} removed from store, exiting.")
                    break
                
                websocket = session_data.get("websocket")
                sc = response.server_content
                
                if sc:
                    if getattr(sc, 'interrupted', False):
                        logger.info(f"Gemini Server reported: INTERRUPTED")
                    if getattr(sc, 'turn_complete', False):
                        logger.info(f"Gemini Server reported: TURN COMPLETE")
                
                if sc and sc.model_turn:
                    for part in sc.model_turn.parts:
                        if part.inline_data:
                            if websocket:
                                try:
                                    await websocket.send_bytes(part.inline_data.data)
                                except Exception as e:
                                    logger.debug(f"Could not send bytes to websocket: {e}")
                
                if sc and sc.output_transcription:
                    text = sc.output_transcription.text
                    logger.info(f"AI Transcript: {text}")
                    ts = int((time.time() - start_time) * 1000)
                    transcript_history.append({"speaker": "interviewer", "text": text, "timestamp": ts})
                    
                    if db_session_id:
                        asyncio.create_task(queries.record_transcript(db_session_id, "interviewer", text, ts))
                    
                    if websocket:
                        try:
                            await websocket.send_json({"type": "transcript", "speaker": "interviewer", "text": text})
                        except Exception as e:
                            logger.debug(f"Could not send transcript to websocket: {e}")
                    
                if sc and sc.input_transcription:
                    text = sc.input_transcription.text
                    logger.info(f"Candidate Transcript: {text}")
                    ts = int((time.time() - start_time) * 1000)
                    transcript_history.append({"speaker": "candidate", "text": text, "timestamp": ts})
                    
                    if db_session_id:
                        asyncio.create_task(queries.record_transcript(db_session_id, "candidate", text, ts))
                    
                    if websocket:
                        try:
                            await websocket.send_json({"type": "transcript", "speaker": "candidate", "text": text})
                        except Exception as e:
                            logger.debug(f"Could not send input transcript to websocket: {e}")
                    
                if sc and getattr(sc, 'turn_complete', False):
                    if websocket:
                        try:
                            await websocket.send_json({"type": "turn_complete"})
                        except: pass
            
            # Check if session was deleted during the receive yield
            if not session_store.get(session_id):
                break
                
    except Exception as e:
        logger.error(f"Relay error for {session_id}: {e}", exc_info=True)
    finally:
        logger.info(f"Relay task finishing for session: {session_id}")
        # Ensure session is closed
        try:
            await genai_session.__aexit__(None, None, None)
        except: pass

