# backend/app/db/connection.py
import asyncpg
from app.config import settings

class DBManager:
    def __init__(self):
        self.pool = None

    async def connect(self):
        if not self.pool:
            dsn = settings.DATABASE_URL
            if "+asyncpg" in dsn:
                dsn = dsn.replace("+asyncpg", "")
            self.pool = await asyncpg.create_pool(dsn=dsn)
            
            # Initialize tables if they don't exist
            async with self.pool.acquire() as conn:
                try:
                    with open("app/db/init.sql", "r") as f:
                        schema = f.read()
                        await conn.execute(schema)
                except Exception as e:
                    print(f"Error initializing database: {e}")
        return self.pool

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

db_manager = DBManager()
