-- Tabla de citas para ms-ai scheduler
-- Ejecutar manualmente en tu base de datos PostgreSQL.
-- La tabla users ya debe existir en tu esquema.

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY,
    calendar_event_id VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('virtual', 'in_person')),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('credit_card', 'complaint', 'refund', 'other')),
    date_time TIMESTAMPTZ NOT NULL,
    description VARCHAR(300) NOT NULL DEFAULT '',
    location VARCHAR(500) NOT NULL DEFAULT '',
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_appointments_user_id ON appointments (user_id);
CREATE INDEX IF NOT EXISTS ix_appointments_date_time ON appointments (date_time);

-- Opcional: descomenta si users.id es UUID/VARCHAR y quieres integridad referencial
-- ALTER TABLE appointments
--     ADD CONSTRAINT fk_appointments_user
--     FOREIGN KEY (user_id) REFERENCES users(id);
