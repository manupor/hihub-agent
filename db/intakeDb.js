import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to intake database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// ============================================
// INTAKE SESSION QUERIES
// ============================================

export async function createIntakeSession(channel, contactInfo) {
    const query = `
        INSERT INTO intake_sessions (channel, contact_info, status, current_question_index)
        VALUES ($1, $2, 'active', 0)
        RETURNING *
    `;
    const result = await pool.query(query, [channel, contactInfo]);
    return result.rows[0];
}

export async function getIntakeSession(sessionId) {
    const query = 'SELECT * FROM intake_sessions WHERE id = $1';
    const result = await pool.query(query, [sessionId]);
    return result.rows[0];
}

export async function updateIntakeSession(sessionId, updates) {
    const { status, currentQuestionIndex } = updates;
    const query = `
        UPDATE intake_sessions 
        SET status = COALESCE($2, status),
            current_question_index = COALESCE($3, current_question_index),
            completed_at = CASE WHEN $2 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = $1
        RETURNING *
    `;
    const result = await pool.query(query, [sessionId, status, currentQuestionIndex]);
    return result.rows[0];
}

export async function getAllIntakeSessions(limit = 50) {
    const query = `
        SELECT * FROM intake_sessions 
        ORDER BY created_at DESC 
        LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
}

// ============================================
// INTAKE ANSWERS QUERIES
// ============================================

export async function saveIntakeAnswer(sessionId, questionKey, questionText, answer, isFollowup = false) {
    const query = `
        INSERT INTO intake_answers (session_id, question_key, question_text, answer, is_followup)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await pool.query(query, [sessionId, questionKey, questionText, answer, isFollowup]);
    return result.rows[0];
}

export async function getIntakeAnswers(sessionId) {
    const query = `
        SELECT * FROM intake_answers 
        WHERE session_id = $1 
        ORDER BY timestamp ASC
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows;
}

// ============================================
// AUDIT BRIEF QUERIES
// ============================================

export async function saveAuditBrief(sessionId, briefData) {
    const {
        briefText,
        clientSummary,
        recommendedAuditType,
        requiredDocuments,
        preliminaryRisks,
        recommendedNextSteps
    } = briefData;

    const query = `
        INSERT INTO audit_briefs (
            session_id, 
            brief_text, 
            client_summary, 
            recommended_audit_type,
            required_documents,
            preliminary_risks,
            recommended_next_steps
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    
    const result = await pool.query(query, [
        sessionId,
        briefText,
        clientSummary,
        recommendedAuditType,
        JSON.stringify(requiredDocuments),
        JSON.stringify(preliminaryRisks),
        JSON.stringify(recommendedNextSteps)
    ]);
    
    return result.rows[0];
}

export async function getAuditBrief(sessionId) {
    const query = 'SELECT * FROM audit_briefs WHERE session_id = $1';
    const result = await pool.query(query, [sessionId]);
    return result.rows[0];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function initializeIntakeDatabase() {
    try {
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Intake database initialized successfully');
        return true;
    } catch (error) {
        console.warn('⚠️  Intake database not available:', error.message);
        console.warn('⚠️  Server will continue without intake database functionality');
        return false;
    }
}

export default pool;
