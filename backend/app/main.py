# backend/app/main.py
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import interview
from app.services.session_store import session_store

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
