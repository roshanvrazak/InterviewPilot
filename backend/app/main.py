# backend/app/main.py
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from app.routers import interview, jd_processor
from app.services.session_store import session_store
from app.db.connection import db_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup())
    yield
    # Clean up the cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

async def periodic_cleanup():
    while True:
        await asyncio.sleep(60)
        session_store.cleanup(max_age=300) # Cleanup sessions older than 5 minutes

app = FastAPI(lifespan=lifespan)
app.include_router(interview.router)
app.include_router(jd_processor.router)

@app.get("/health/db")
async def health_db():
    try:
        pool = await db_manager.connect()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        return Response(content=str(e), status_code=500)

@app.get("/health/ready")
async def health_ready():
    return {"status": "ready"}
