-- Extend PQRS categories with technical_support (Soporte Técnico).
-- Run manually against the ms_ai PostgreSQL database.

ALTER TABLE pqrs DROP CONSTRAINT IF EXISTS pqrs_category_check;
ALTER TABLE pqrs ADD CONSTRAINT pqrs_category_check CHECK (
    category IN ('driver', 'bus', 'route', 'card', 'technical_support', 'other')
);
