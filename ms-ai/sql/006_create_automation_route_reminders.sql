-- Bridge table for route reminders (IDs only — no copy of business schedules).
-- Run manually against the ms_ai PostgreSQL database.

CREATE TABLE IF NOT EXISTS automation_route_reminders (
    id UUID PRIMARY KEY,
    business_schedule_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL,
    calendar_event_id VARCHAR(255),
    sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED', 'CANCELLED')),
    last_error VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_schedule_id, user_email)
);

CREATE INDEX IF NOT EXISTS ix_automation_route_reminders_user
    ON automation_route_reminders (user_id);
