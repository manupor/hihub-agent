-- Database Schema for HiHub Agent
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'collecting' CHECK (status IN ('collecting', 'qualified', 'scheduled', 'cancelled')),
    channel VARCHAR(20) DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp')),
    phone VARCHAR(50),
    name VARCHAR(255),
    email VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'es'
);

-- Lead messages table
CREATE TABLE IF NOT EXISTS lead_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    has_image BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead qualifications table
CREATE TABLE IF NOT EXISTS lead_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    product_type VARCHAR(255),
    product_description TEXT,
    technical_specs JSONB DEFAULT '{}',
    quantity_needed VARCHAR(100),
    destination_country VARCHAR(100),
    timeline VARCHAR(100),
    budget_range VARCHAR(100),
    additional_notes TEXT,
    image_urls TEXT[] DEFAULT '{}',
    qualification_score INTEGER CHECK (qualification_score >= 1 AND qualification_score <= 10),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    calendly_event_id VARCHAR(255),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    client_notified BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_qualifications_lead_id ON lead_qualifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
