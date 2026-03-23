# backend/app/main.py
from fastapi import FastAPI, Response
from app.routers import interview
from app.db.connection import db_manager

app = FastAPI()
app.include_router(interview.router)

# Add these routes to your app
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
