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
