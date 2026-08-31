-- ms-security: schema completo (un solo archivo)
-- Ejecutar: node scripts/sql-migrate.cjs ms-security

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS security;
COMMENT ON SCHEMA security IS 'ms-security: auth, RBAC, GitHub OAuth, 2FA (auth_factors); JWT is stateless';

-- ---------------------------------------------------------------------------
-- Core: login / RBAC
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS security.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS security.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    description TEXT,
    CONSTRAINT roles_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS security.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(512) NOT NULL,
    method VARCHAR(16) NOT NULL,
    CONSTRAINT permissions_url_method_unique UNIQUE (url, method)
);

CREATE TABLE IF NOT EXISTS security.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES security.roles (id) ON DELETE CASCADE,
    CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON security.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON security.user_roles (role_id);

CREATE TABLE IF NOT EXISTS security.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES security.roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES security.permissions (id) ON DELETE CASCADE,
    CONSTRAINT role_permissions_role_perm_unique UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON security.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON security.role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- 2FA / password-reset challenges
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS security.auth_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users (id) ON DELETE CASCADE,
    code VARCHAR(128) NOT NULL,
    expiration TIMESTAMPTZ,
    token TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    type VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_factors_user_id ON security.auth_factors (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_factors_token ON security.auth_factors (token);

-- ---------------------------------------------------------------------------
-- GitHub OAuth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS security.github_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users (id) ON DELETE CASCADE,
    provider_user_id BIGINT NOT NULL,
    username VARCHAR(255),
    display_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    profile_url TEXT,
    linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT github_accounts_provider_user_id_unique UNIQUE (provider_user_id),
    CONSTRAINT github_accounts_user_id_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS security.github_auth_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(255) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    user_id UUID REFERENCES security.users (id) ON DELETE SET NULL,
    expiration TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    github_user_id BIGINT,
    github_username VARCHAR(255),
    github_name VARCHAR(255),
    github_email VARCHAR(255),
    github_avatar_url TEXT,
    github_profile_url TEXT,
    CONSTRAINT github_auth_requests_state_unique UNIQUE (state)
);

-- ---------------------------------------------------------------------------
-- Seed roles (stable names for ms-business MS_SECURITY_ROLE_*_ID later)
-- ---------------------------------------------------------------------------

INSERT INTO security.roles (id, name, description)
VALUES
    (uuid_generate_v4(), 'ADMIN', 'Administrador del sistema'),
    (uuid_generate_v4(), 'USER', 'Usuario básico'),
    (uuid_generate_v4(), 'CITIZEN', 'Ciudadano / pasajero'),
    (uuid_generate_v4(), 'DRIVER', 'Conductor'),
    (uuid_generate_v4(), 'BUSINESS_ADMIN', 'Administrador de empresa de transporte'),
    (uuid_generate_v4(), 'SUPERVISOR', 'Supervisor de operaciones')
ON CONFLICT (name) DO NOTHING;
 -- ms-security V2: seed permissions + role_permissions (ms-business authorize + ADMIN security)
-- Idempotent. Apply via: node scripts/db-migrate.cjs --only ms-security
-- Paths match Nest ms-business (no /api prefix). ms-security admin URLs are post-/api strip.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Permissions catalog
-- ---------------------------------------------------------------------------

INSERT INTO security.permissions (id, url, method)
VALUES
    -- Catalog read (CITIZEN+)
    (uuid_generate_v4(), '/route', 'GET'),
    (uuid_generate_v4(), '/route/*', 'GET'),
    (uuid_generate_v4(), '/stop', 'GET'),
    (uuid_generate_v4(), '/stop/*', 'GET'),
    (uuid_generate_v4(), '/bus', 'GET'),
    (uuid_generate_v4(), '/bus/*', 'GET'),
    (uuid_generate_v4(), '/scheduler', 'GET'),
    (uuid_generate_v4(), '/scheduler/*', 'GET'),
    (uuid_generate_v4(), '/node', 'GET'),
    (uuid_generate_v4(), '/node/*', 'GET'),
    (uuid_generate_v4(), '/history', 'GET'),
    (uuid_generate_v4(), '/history/*', 'GET'),

    -- DRIVER
    (uuid_generate_v4(), '/incident-reports/driver', 'POST'),
    (uuid_generate_v4(), '/gps/bus/*', 'POST'),
    (uuid_generate_v4(), '/gps', 'GET'),
    (uuid_generate_v4(), '/gps/*', 'GET'),

    -- SUPERVISOR / ops
    (uuid_generate_v4(), '/incident-reports', 'GET'),
    (uuid_generate_v4(), '/incident-reports/*', 'GET'),
    (uuid_generate_v4(), '/incident-reports/*/status', 'PUT'),
    (uuid_generate_v4(), '/incident-reports/*/comments', 'GET'),
    (uuid_generate_v4(), '/incident-reports/*/comments', 'POST'),
    (uuid_generate_v4(), '/gps/*', 'PUT'),
    (uuid_generate_v4(), '/gps/*', 'DELETE'),

    -- BUSINESS_ADMIN fleet
    (uuid_generate_v4(), '/bus', 'POST'),
    (uuid_generate_v4(), '/bus/fleet', 'GET'),
    (uuid_generate_v4(), '/bus/*', 'PUT'),
    (uuid_generate_v4(), '/bus/*', 'DELETE'),
    (uuid_generate_v4(), '/bus/*/photo', 'POST'),
    (uuid_generate_v4(), '/bus-photo/bus/*', 'POST'),
    (uuid_generate_v4(), '/bus-photo/*', 'GET'),
    (uuid_generate_v4(), '/bus-photo/*', 'DELETE'),

    -- ADMIN catalog + enterprise mutations
    (uuid_generate_v4(), '/route', 'POST'),
    (uuid_generate_v4(), '/route/*', 'PUT'),
    (uuid_generate_v4(), '/route/*', 'DELETE'),
    (uuid_generate_v4(), '/stop', 'POST'),
    (uuid_generate_v4(), '/stop/*', 'PUT'),
    (uuid_generate_v4(), '/stop/*', 'DELETE'),
    (uuid_generate_v4(), '/scheduler', 'POST'),
    (uuid_generate_v4(), '/scheduler/*', 'PUT'),
    (uuid_generate_v4(), '/scheduler/*', 'DELETE'),
    (uuid_generate_v4(), '/node/route/*/stop/*', 'POST'),
    (uuid_generate_v4(), '/node/*', 'PUT'),
    (uuid_generate_v4(), '/node/*', 'DELETE'),
    (uuid_generate_v4(), '/enterprise', 'POST'),
    (uuid_generate_v4(), '/enterprise/*', 'PUT'),
    (uuid_generate_v4(), '/enterprise/*', 'DELETE'),
    (uuid_generate_v4(), '/history', 'POST'),
    (uuid_generate_v4(), '/history/*', 'PUT'),
    (uuid_generate_v4(), '/history/*', 'DELETE'),

    -- ADMIN persons (list/CRUD; self-service uses /me + @Authenticated)
    (uuid_generate_v4(), '/citizen', 'GET'),
    (uuid_generate_v4(), '/citizen/*', 'GET'),
    (uuid_generate_v4(), '/citizen/*', 'PUT'),
    (uuid_generate_v4(), '/citizen/*', 'DELETE'),
    (uuid_generate_v4(), '/driver', 'GET'),
    (uuid_generate_v4(), '/driver/*', 'GET'),
    (uuid_generate_v4(), '/driver/*', 'PUT'),
    (uuid_generate_v4(), '/driver/*', 'DELETE'),

    -- ADMIN address (list/CRUD; create for onboarding is @Authenticated)
    (uuid_generate_v4(), '/address', 'GET'),
    (uuid_generate_v4(), '/address/*', 'GET'),
    (uuid_generate_v4(), '/address/*', 'PUT'),
    (uuid_generate_v4(), '/address/*', 'DELETE'),

    -- ADMIN ms-security (ValidatorService strips /api; UUID/id → ?)
    (uuid_generate_v4(), '/roles', 'GET'),
    (uuid_generate_v4(), '/roles', 'POST'),
    (uuid_generate_v4(), '/roles/?', 'GET'),
    (uuid_generate_v4(), '/roles/?', 'PUT'),
    (uuid_generate_v4(), '/roles/?', 'DELETE'),
    (uuid_generate_v4(), '/permissions', 'GET'),
    (uuid_generate_v4(), '/permissions', 'POST'),
    (uuid_generate_v4(), '/permissions/?', 'GET'),
    (uuid_generate_v4(), '/permissions/?', 'PUT'),
    (uuid_generate_v4(), '/permissions/?', 'DELETE'),
    (uuid_generate_v4(), '/role-permission/assign-multiple', 'POST'),
    (uuid_generate_v4(), '/role-permission/role/?/permission/?', 'POST'),
    (uuid_generate_v4(), '/role-permission/?', 'DELETE')
ON CONFLICT (url, method) DO NOTHING;

-- Helper: link role name → all matching (url, method) pairs
-- ---------------------------------------------------------------------------
-- CITIZEN
-- ---------------------------------------------------------------------------

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/route', 'GET'),
        ('/route/*', 'GET'),
        ('/stop', 'GET'),
        ('/stop/*', 'GET'),
        ('/bus', 'GET'),
        ('/bus/*', 'GET'),
        ('/scheduler', 'GET'),
        ('/scheduler/*', 'GET'),
        ('/node', 'GET'),
        ('/node/*', 'GET'),
        ('/history', 'GET'),
        ('/history/*', 'GET')
    )
)
WHERE r.name = 'CITIZEN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- DRIVER (extras; keep CITIZEN on the user for catalog reads)
-- ---------------------------------------------------------------------------

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/route', 'GET'),
        ('/route/*', 'GET'),
        ('/stop', 'GET'),
        ('/stop/*', 'GET'),
        ('/bus', 'GET'),
        ('/bus/*', 'GET'),
        ('/scheduler', 'GET'),
        ('/scheduler/*', 'GET'),
        ('/node', 'GET'),
        ('/node/*', 'GET'),
        ('/history', 'GET'),
        ('/history/*', 'GET'),
        ('/incident-reports/driver', 'POST'),
        ('/gps/bus/*', 'POST'),
        ('/gps', 'GET'),
        ('/gps/*', 'GET')
    )
)
WHERE r.name = 'DRIVER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SUPERVISOR
-- ---------------------------------------------------------------------------

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/route', 'GET'),
        ('/route/*', 'GET'),
        ('/stop', 'GET'),
        ('/stop/*', 'GET'),
        ('/bus', 'GET'),
        ('/bus/*', 'GET'),
        ('/scheduler', 'GET'),
        ('/scheduler/*', 'GET'),
        ('/node', 'GET'),
        ('/node/*', 'GET'),
        ('/history', 'GET'),
        ('/history/*', 'GET'),
        ('/incident-reports', 'GET'),
        ('/incident-reports/*', 'GET'),
        ('/incident-reports/*/status', 'PUT'),
        ('/incident-reports/*/comments', 'GET'),
        ('/incident-reports/*/comments', 'POST'),
        ('/gps/bus/*', 'POST'),
        ('/gps', 'GET'),
        ('/gps/*', 'GET'),
        ('/gps/*', 'PUT'),
        ('/gps/*', 'DELETE')
    )
)
WHERE r.name = 'SUPERVISOR'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- BUSINESS_ADMIN = SUPERVISOR + fleet
-- ---------------------------------------------------------------------------

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/route', 'GET'),
        ('/route/*', 'GET'),
        ('/stop', 'GET'),
        ('/stop/*', 'GET'),
        ('/bus', 'GET'),
        ('/bus/*', 'GET'),
        ('/scheduler', 'GET'),
        ('/scheduler/*', 'GET'),
        ('/node', 'GET'),
        ('/node/*', 'GET'),
        ('/history', 'GET'),
        ('/history/*', 'GET'),
        ('/incident-reports', 'GET'),
        ('/incident-reports/*', 'GET'),
        ('/incident-reports/*/status', 'PUT'),
        ('/incident-reports/*/comments', 'GET'),
        ('/incident-reports/*/comments', 'POST'),
        ('/gps/bus/*', 'POST'),
        ('/gps', 'GET'),
        ('/gps/*', 'GET'),
        ('/gps/*', 'PUT'),
        ('/gps/*', 'DELETE'),
        ('/bus', 'POST'),
        ('/bus/fleet', 'GET'),
        ('/bus/*', 'PUT'),
        ('/bus/*', 'DELETE'),
        ('/bus/*/photo', 'POST'),
        ('/bus-photo/bus/*', 'POST'),
        ('/bus-photo/*', 'GET'),
        ('/bus-photo/*', 'DELETE')
    )
)
WHERE r.name = 'BUSINESS_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ADMIN = all business + security admin APIs
-- ---------------------------------------------------------------------------

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
 -- Nullable password for OAuth-only accounts (GitHub/Google without local password)
ALTER TABLE security.users
    ALTER COLUMN password DROP NOT NULL;
 -- Permissions for /api/users and /api/user-role (admin JWT routes; ValidatorService strips /api)
INSERT INTO security.permissions (id, url, method)
VALUES
    (uuid_generate_v4(), '/users', 'GET'),
    (uuid_generate_v4(), '/users', 'POST'),
    (uuid_generate_v4(), '/users/?', 'GET'),
    (uuid_generate_v4(), '/users/?', 'PUT'),
    (uuid_generate_v4(), '/users/?', 'DELETE'),
    (uuid_generate_v4(), '/users/?/profile/?', 'POST'),
    (uuid_generate_v4(), '/users/?/profile/?', 'DELETE'),
    (uuid_generate_v4(), '/user-role/user/?/role/?', 'POST'),
    (uuid_generate_v4(), '/user-role/user/?/role-name/CITIZEN', 'POST'),
    (uuid_generate_v4(), '/user-role/user/?/role-name/DRIVER', 'POST'),
    (uuid_generate_v4(), '/user-role/user/?/role-name/ADMIN', 'POST'),
    (uuid_generate_v4(), '/user-role/user/?/role-name/SUPERVISOR', 'POST'),
    (uuid_generate_v4(), '/user-role/user/?/role-name/BUSINESS_ADMIN', 'POST'),
    (uuid_generate_v4(), '/user-role/?', 'DELETE'),
    (uuid_generate_v4(), '/user-role/assign-multiple', 'POST')
ON CONFLICT (url, method) DO NOTHING;

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.name = 'ADMIN'
  AND p.url IN (
    '/users',
    '/users/?',
    '/users/?/profile/?',
    '/user-role/user/?/role/?',
    '/user-role/user/?/role-name/CITIZEN',
    '/user-role/user/?/role-name/DRIVER',
    '/user-role/user/?/role-name/ADMIN',
    '/user-role/user/?/role-name/SUPERVISOR',
    '/user-role/user/?/role-name/BUSINESS_ADMIN',
    '/user-role/?',
    '/user-role/assign-multiple'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
 -- Drop security.profiles (phone/photo). Domain profile lives in ms-business persons.
-- Idempotent.

DELETE FROM security.role_permissions rp
USING security.permissions p
WHERE rp.permission_id = p.id
  AND (
    p.url = '/profiles'
    OR p.url LIKE '/profiles/%'
  );

DELETE FROM security.permissions
WHERE url = '/profiles'
   OR url LIKE '/profiles/%';

DROP TABLE IF EXISTS security.profiles;
 -- Permissions for citizen/driver admin list+CRUD (idempotent).
-- ADMIN gets them via CROSS JOIN of all permissions.

INSERT INTO security.permissions (id, url, method)
VALUES
    (uuid_generate_v4(), '/citizen', 'GET'),
    (uuid_generate_v4(), '/citizen/*', 'GET'),
    (uuid_generate_v4(), '/citizen/*', 'PUT'),
    (uuid_generate_v4(), '/citizen/*', 'DELETE'),
    (uuid_generate_v4(), '/driver', 'GET'),
    (uuid_generate_v4(), '/driver/*', 'GET'),
    (uuid_generate_v4(), '/driver/*', 'PUT'),
    (uuid_generate_v4(), '/driver/*', 'DELETE')
ON CONFLICT (url, method) DO NOTHING;

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/citizen', 'GET'),
        ('/citizen/*', 'GET'),
        ('/citizen/*', 'PUT'),
        ('/citizen/*', 'DELETE'),
        ('/driver', 'GET'),
        ('/driver/*', 'GET'),
        ('/driver/*', 'PUT'),
        ('/driver/*', 'DELETE')
    )
)
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
 -- Permissions for address admin list+CRUD (idempotent).

INSERT INTO security.permissions (id, url, method)
VALUES
    (uuid_generate_v4(), '/address', 'GET'),
    (uuid_generate_v4(), '/address/*', 'GET'),
    (uuid_generate_v4(), '/address/*', 'PUT'),
    (uuid_generate_v4(), '/address/*', 'DELETE')
ON CONFLICT (url, method) DO NOTHING;

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/address', 'GET'),
        ('/address/*', 'GET'),
        ('/address/*', 'PUT'),
        ('/address/*', 'DELETE')
    )
)
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
 -- Admin list/CRUD permissions for unseeded domain resources (idempotent).

INSERT INTO security.permissions (id, url, method)
VALUES
    (uuid_generate_v4(), '/payment-method-citizen', 'GET'),
    (uuid_generate_v4(), '/payment-method-citizen', 'POST'),
    (uuid_generate_v4(), '/payment-method-citizen/*', 'GET'),
    (uuid_generate_v4(), '/payment-method-citizen/*', 'PUT'),
    (uuid_generate_v4(), '/payment-method-citizen/*', 'DELETE'),
    (uuid_generate_v4(), '/payment-method', 'POST'),
    (uuid_generate_v4(), '/payment-method/*', 'PUT'),
    (uuid_generate_v4(), '/payment-method/*', 'DELETE'),
    (uuid_generate_v4(), '/supervisor', 'GET'),
    (uuid_generate_v4(), '/supervisor/*', 'GET'),
    (uuid_generate_v4(), '/supervisor/*', 'PUT'),
    (uuid_generate_v4(), '/supervisor/*', 'DELETE'),
    (uuid_generate_v4(), '/ticket', 'GET'),
    (uuid_generate_v4(), '/ticket', 'POST'),
    (uuid_generate_v4(), '/ticket/*', 'GET'),
    (uuid_generate_v4(), '/ticket/*', 'PUT'),
    (uuid_generate_v4(), '/ticket/*', 'DELETE'),
    (uuid_generate_v4(), '/turn', 'GET'),
    (uuid_generate_v4(), '/turn', 'POST'),
    (uuid_generate_v4(), '/turn/*', 'GET'),
    (uuid_generate_v4(), '/turn/*', 'PUT'),
    (uuid_generate_v4(), '/turn/*', 'DELETE')
ON CONFLICT (url, method) DO NOTHING;

INSERT INTO security.role_permissions (id, role_id, permission_id)
SELECT uuid_generate_v4(), r.id, p.id
FROM security.roles r
JOIN security.permissions p ON (
    (p.url, p.method) IN (
        ('/payment-method-citizen', 'GET'),
        ('/payment-method-citizen', 'POST'),
        ('/payment-method-citizen/*', 'GET'),
        ('/payment-method-citizen/*', 'PUT'),
        ('/payment-method-citizen/*', 'DELETE'),
        ('/payment-method', 'POST'),
        ('/payment-method/*', 'PUT'),
        ('/payment-method/*', 'DELETE'),
        ('/supervisor', 'GET'),
        ('/supervisor/*', 'GET'),
        ('/supervisor/*', 'PUT'),
        ('/supervisor/*', 'DELETE'),
        ('/ticket', 'GET'),
        ('/ticket', 'POST'),
        ('/ticket/*', 'GET'),
        ('/ticket/*', 'PUT'),
        ('/ticket/*', 'DELETE'),
        ('/turn', 'GET'),
        ('/turn', 'POST'),
        ('/turn/*', 'GET'),
        ('/turn/*', 'PUT'),
        ('/turn/*', 'DELETE')
    )
)
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
 -- Drop unused Microsoft OAuth tables (login retirado del API; sin entidades JPA).

DROP TABLE IF EXISTS security.microsoft_auth_requests;
DROP TABLE IF EXISTS security.microsoft_accounts;
 -- Drop unused / placeholder tables (no JPA entities; JWT is Stateless).
-- microsoft_* also covered by V9; DROP IF EXISTS keeps this idempotent.

DROP TABLE IF EXISTS security.microsoft_auth_requests;
DROP TABLE IF EXISTS security.microsoft_accounts;
DROP TABLE IF EXISTS security.google_auth_requests;
DROP TABLE IF EXISTS security.google_accounts;
DROP TABLE IF EXISTS security.sessions;
