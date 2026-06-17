-- Weather alert subscriptions for ms-ai
-- Run manually against the ms_ai PostgreSQL database.

CREATE TABLE IF NOT EXISTS weather_notifications (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    travel_hour INT NOT NULL CHECK (travel_hour BETWEEN 0 AND 23),
    city_name VARCHAR(255) NOT NULL,
    city_lat DOUBLE PRECISION NOT NULL,
    city_lon DOUBLE PRECISION NOT NULL,
    preferred_channel VARCHAR(20) NOT NULL DEFAULT 'email'
        CHECK (preferred_channel IN ('email', 'whatsapp', 'push')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_alert_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_weather_notifications_user_id ON weather_notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_weather_notifications_active ON weather_notifications (is_active, travel_hour);
