# backend/app/main.py
from fastapi import FastAPI
from app.routers import interview

app = FastAPI()
app.include_router(interview.router)
