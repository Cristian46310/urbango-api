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
