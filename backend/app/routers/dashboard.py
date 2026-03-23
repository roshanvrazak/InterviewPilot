from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.db.connection import db_manager

router = APIRouter()

@router.get("/api/dashboard/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    pool = await db_manager.connect()
    async with pool.acquire() as conn:
        records = await conn.fetch("""
            SELECT i.id, i.role_name, i.interview_type, i.started_at, i.status, s.overall_score
            FROM interview_sessions i
            LEFT JOIN scorecards s ON i.id = s.session_id
            WHERE i.user_id = $1
            ORDER BY i.started_at DESC
        """, current_user['id'])
        return [dict(record) for record in records]

@router.get("/api/dashboard/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    pool = await db_manager.connect()
    async with pool.acquire() as conn:
        stats = await conn.fetchrow("""
            SELECT 
                COUNT(i.id) as total_interviews,
                AVG(s.overall_score) as average_score
            FROM interview_sessions i
            LEFT JOIN scorecards s ON i.id = s.session_id
            WHERE i.user_id = $1 AND i.status = 'completed'
        """, current_user['id'])
        
        avg_score = float(stats['average_score']) if stats['average_score'] else 0
        
        return {
            "total_interviews": stats['total_interviews'] or 0,
            "average_score": round(avg_score, 1)
        }
