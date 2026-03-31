-- Intake System Database Schema
-- Tables for conversational intake agent with audit brief generation

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_briefs CASCADE;
DROP TABLE IF EXISTS intake_answers CASCADE;
DROP TABLE IF EXISTS intake_sessions CASCADE;

-- Intake sessions table
CREATE TABLE intake_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('web', 'whatsapp')),
    contact_info TEXT, -- phone or email
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    current_question_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Intake answers table
CREATE TABLE intake_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES intake_sessions(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL, -- e.g., 'company_name', 'company_type', etc.
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_followup BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit briefs table
CREATE TABLE audit_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES intake_sessions(id) ON DELETE CASCADE,
    brief_text TEXT NOT NULL,
    client_summary TEXT,
    recommended_audit_type TEXT,
    required_documents JSONB,
    preliminary_risks JSONB,
    recommended_next_steps JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_intake_sessions_status ON intake_sessions(status);
CREATE INDEX idx_intake_sessions_created_at ON intake_sessions(created_at DESC);
CREATE INDEX idx_intake_answers_session_id ON intake_answers(session_id);
CREATE INDEX idx_audit_briefs_session_id ON audit_briefs(session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_intake_sessions_updated_at
    BEFORE UPDATE ON intake_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
