-- Drop unused Microsoft OAuth tables (login retirado del API; sin entidades JPA).

DROP TABLE IF EXISTS security.microsoft_auth_requests;
DROP TABLE IF EXISTS security.microsoft_accounts;
