# backend/app/db/queries.py
import json
from app.db.connection import db_manager

async def create_session(role_id: str, role_name: str, interview_type: str):
    pool = await db_manager.connect()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO interview_sessions (role_id, role_name, interview_type)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            role_id, role_name, interview_type
        )
        return row['id']

async def record_transcript(session_id: str, speaker: str, content: str, timestamp_ms: int):
    pool = await db_manager.connect()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO transcript_entries (session_id, speaker, content, timestamp_ms)
            VALUES ($1, $2, $3, $4)
            """,
            session_id, speaker, content, timestamp_ms
        )

async def save_scorecard(session_id: str, overall_score: float, scorecard_json: dict):
    pool = await db_manager.connect()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO scorecards (session_id, overall_score, scorecard_json)
            VALUES ($1, $2, $3)
            """,
            session_id, overall_score, json.dumps(scorecard_json)
        )
        await conn.execute(
            """
            UPDATE interview_sessions SET status = 'completed', ended_at = NOW() WHERE id = $1
            """,
            session_id
        )
