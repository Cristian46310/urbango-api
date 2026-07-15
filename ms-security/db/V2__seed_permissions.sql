-- ms-security V2: seed permissions + role_permissions (ms-business authorize + ADMIN security)
-- Idempotent. Apply: node ../ms-security/db/apply-v2.cjs  (from ms-business/)
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
    (uuid_generate_v4(), '/role-permission/?', 'DELETE'),
    (uuid_generate_v4(), '/profiles', 'GET'),
    (uuid_generate_v4(), '/profiles', 'POST'),
    (uuid_generate_v4(), '/profiles/?', 'GET'),
    (uuid_generate_v4(), '/profiles/?', 'PUT'),
    (uuid_generate_v4(), '/profiles/?', 'DELETE')
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
