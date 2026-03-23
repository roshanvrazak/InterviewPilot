#!/bin/bash
set -e

echo "Starting pre-flight checks..."

# Run environment validation
python check_env.py

# Wait for DB to be reachable
echo "Waiting for database to be ready..."
# Simple retry loop for DB connectivity using python
python << EOF
import asyncio
import os
import asyncpg
import time

async def wait_for_db():
    url = os.getenv("DATABASE_URL")
    while True:
        try:
            conn = await asyncpg.connect(url)
            await conn.close()
            print("Database is ready!")
            break
        except Exception:
            print("Database not ready yet, retrying in 2s...")
            time.sleep(2)

asyncio.run(wait_for_db())
EOF

echo "Pre-flight checks completed. Starting Uvicorn..."
exec "$@"
