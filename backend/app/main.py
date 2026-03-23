# backend/app/main.py
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from app.routers import interview, jd_processor, pdf_export
from app.routers.interview import session_manager
from app.services.session_store import session_store
from app.db.connection import db_manager
from app.utils.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up...")
    # Start background cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    logger.info("Application shutting down...")
    # Clean up the session cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    # Close the database pool
    try:
        await db_manager.disconnect()
        logger.info("Database pool closed.")
    except Exception as e:
        logger.error(f"Error closing database pool: {e}")
    
    # (Optionally) Close all active Gemini sessions in the session_store
    # For now, just ensure the store is cleared or logged
    logger.info(f"Clearing session store. Active sessions: {len(session_store.sessions)}")
    session_store.sessions.clear()

async def periodic_cleanup():
    while True:
        await asyncio.sleep(60)
        session_store.cleanup(max_age=300) # Cleanup sessions older than 5 minutes

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
app.include_router(jd_processor.router)
app.include_router(pdf_export.router)

@app.get("/")
async def root():
    return {"message": "AI Mock Interviewer Backend is running"}

@app.get("/health/db")
async def health_db():
    try:
        pool = await db_manager.connect()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        return Response(content=str(e), status_code=500)

@app.get("/health/gemini")
async def health_gemini():
    is_ok = await session_manager.check_connectivity()
    if is_ok:
        return {"status": "ok"}
    return Response(content="Gemini API unavailable", status_code=503)

@app.get("/health/ready")
async def health_ready():
    return {"status": "ready"}
