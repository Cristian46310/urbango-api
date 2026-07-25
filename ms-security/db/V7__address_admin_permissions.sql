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
