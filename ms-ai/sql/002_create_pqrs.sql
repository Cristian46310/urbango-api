-- PQRS tables for ms-ai
-- Run manually against the ms_ai PostgreSQL database.

CREATE TABLE IF NOT EXISTS pqrs_ticket_seq (
    year INT PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_ticket_number(p_year INT)
RETURNS VARCHAR(20) AS $$
DECLARE
    new_seq INT;
BEGIN
    INSERT INTO pqrs_ticket_seq (year, last_seq)
    VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE
        SET last_seq = pqrs_ticket_seq.last_seq + 1
    RETURNING last_seq INTO new_seq;

    RETURN 'PQRS-' || p_year::TEXT || '-' || LPAD(new_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS pqrs (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('petition', 'complaint', 'claim', 'suggestion')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('driver', 'bus', 'route', 'card', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (
        status IN ('received', 'in_review', 'in_progress', 'resolved')
    ),
    description VARCHAR(500) NOT NULL DEFAULT '',
    user_id VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL,
    estimated_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    sla_alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pqrs_images (
    id UUID PRIMARY KEY,
    pqrs_id UUID NOT NULL REFERENCES pqrs(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    original_name VARCHAR(255) NOT NULL DEFAULT '',
    mime_type VARCHAR(100) NOT NULL DEFAULT '',
    size INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pqrs_updates (
    id UUID PRIMARY KEY,
    pqrs_id UUID NOT NULL REFERENCES pqrs(id) ON DELETE CASCADE,
    status_from VARCHAR(50) CHECK (
        status_from IS NULL OR status_from IN ('received', 'in_review', 'in_progress', 'resolved')
    ),
    status_to VARCHAR(50) CHECK (
        status_to IS NULL OR status_to IN ('received', 'in_review', 'in_progress', 'resolved')
    ),
    action VARCHAR(100) NOT NULL DEFAULT '',
    description VARCHAR(1000) NOT NULL DEFAULT '',
    agent_response VARCHAR(2000) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_pqrs_ticket_number ON pqrs (ticket_number);
CREATE INDEX IF NOT EXISTS ix_pqrs_user_email ON pqrs (user_email);
CREATE INDEX IF NOT EXISTS ix_pqrs_status ON pqrs (status);
CREATE INDEX IF NOT EXISTS ix_pqrs_estimated_response_at ON pqrs (estimated_response_at);
CREATE INDEX IF NOT EXISTS ix_pqrs_images_pqrs_id ON pqrs_images (pqrs_id);
CREATE INDEX IF NOT EXISTS ix_pqrs_updates_pqrs_id ON pqrs_updates (pqrs_id);
