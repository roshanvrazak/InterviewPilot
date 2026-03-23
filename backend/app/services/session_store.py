# backend/app/services/session_store.py
import time
from typing import Dict, Any

class SessionStore:
    def __init__(self):
        self.sessions: Dict[str, Any] = {}
        self.last_seen: Dict[str, float] = {}

    def save(self, session_id: str, session: Any):
        self.sessions[session_id] = session
        self.last_seen[session_id] = time.time()

    def get(self, session_id: str):
        if session_id in self.sessions:
            self.last_seen[session_id] = time.time()
            return self.sessions[session_id]
        return None

    def delete(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
            del self.last_seen[session_id]

    def cleanup(self, max_age: int = 60):
        now = time.time()
        expired = [sid for sid, ts in self.last_seen.items() if now - ts > max_age]
        for sid in expired:
            del self.sessions[sid]
            del self.last_seen[sid]

session_store = SessionStore()
