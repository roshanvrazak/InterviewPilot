-- backend/app/db/init.sql

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    interview_type VARCHAR(30) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS transcript_entries (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score NUMERIC(3,1),
    scorecard_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcript_entries(session_id);
