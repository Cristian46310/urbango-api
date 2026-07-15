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
