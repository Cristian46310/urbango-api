-- Allow multiple weather alerts per user (e.g. morning and evening commute).
-- Run if 003 was applied with user_id UNIQUE.

ALTER TABLE weather_notifications
    DROP CONSTRAINT IF EXISTS weather_notifications_user_id_key;

CREATE INDEX IF NOT EXISTS ix_weather_notifications_user_id ON weather_notifications (user_id);
