-- Drop unused / placeholder tables (no JPA entities; JWT is Stateless).
-- microsoft_* also covered by V9; DROP IF EXISTS keeps this idempotent.

DROP TABLE IF EXISTS security.microsoft_auth_requests;
DROP TABLE IF EXISTS security.microsoft_accounts;
DROP TABLE IF EXISTS security.google_auth_requests;
DROP TABLE IF EXISTS security.google_accounts;
DROP TABLE IF EXISTS security.sessions;
