# backend/app/db/connection.py
import asyncpg
from app.config import settings

class DBManager:
    def __init__(self):
        self.pool = None

    async def connect(self):
        if not self.pool:
            # Note: Expects DATABASE_URL in settings to be asyncpg-compatible (postgresql://...)
            self.pool = await asyncpg.create_pool(dsn=settings.DATABASE_URL)
        return self.pool

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

db_manager = DBManager()
