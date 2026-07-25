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
