import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Lead queries
export const createLead = async (channel, phone = null) => {
    const result = await pool.query(
        'INSERT INTO leads (channel, phone) VALUES ($1, $2) RETURNING *',
        [channel, phone]
    );
    return result.rows[0];
};

export const getLeadById = async (id) => {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    return result.rows[0];
};

export const updateLead = async (id, updates) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await pool.query(
        `UPDATE leads SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return result.rows[0];
};

// Message queries
export const createMessage = async (leadId, role, content, hasImage = false, imageUrl = null) => {
    const result = await pool.query(
        'INSERT INTO lead_messages (lead_id, role, content, has_image, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [leadId, role, content, hasImage, imageUrl]
    );
    return result.rows[0];
};

export const getMessagesByLeadId = async (leadId) => {
    const result = await pool.query(
        'SELECT * FROM lead_messages WHERE lead_id = $1 ORDER BY created_at ASC',
        [leadId]
    );
    return result.rows;
};

// Qualification queries
export const createQualification = async (leadId, data) => {
    const result = await pool.query(
        `INSERT INTO lead_qualifications 
        (lead_id, product_type, product_description, technical_specs, quantity_needed, 
         destination_country, timeline, budget_range, additional_notes, image_urls, qualification_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [leadId, data.product_type, data.product_description, data.technical_specs, 
         data.quantity_needed, data.destination_country, data.timeline, data.budget_range, 
         data.additional_notes, data.image_urls || [], data.qualification_score]
    );
    return result.rows[0];
};

export const getQualificationByLeadId = async (leadId) => {
    const result = await pool.query(
        'SELECT * FROM lead_qualifications WHERE lead_id = $1',
        [leadId]
    );
    return result.rows[0];
};

// Appointment queries
export const createAppointment = async (leadId, data) => {
    const result = await pool.query(
        `INSERT INTO appointments 
        (lead_id, calendly_event_id, scheduled_at, duration_minutes, meeting_link)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [leadId, data.calendly_event_id, data.scheduled_at, data.duration_minutes, data.meeting_link]
    );
    return result.rows[0];
};

export const getAppointmentByLeadId = async (leadId) => {
    const result = await pool.query(
        'SELECT * FROM appointments WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1',
        [leadId]
    );
    return result.rows[0];
};

export default pool;
