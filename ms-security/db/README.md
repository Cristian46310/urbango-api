# Schema SQL — ms-security (Supabase)

Scripts versionados del schema PostgreSQL `security` (mismo proyecto Supabase que ms-business / `public`).

| Archivo | Contenido |
|---------|-----------|
| `V1__security_schema.sql` | Schema, tablas core + OAuth/2FA placeholders, seed de roles (`password` nullable) |
| `V2__seed_permissions.sql` | Permisos RBAC ms-business + admin security base |
| `V3__users_password_nullable.sql` | `ALTER` password nullable (si V1 viejo ya aplicado) |
| `V4__admin_users_roles_permissions.sql` | Permisos `/users` y `/user-role` para ADMIN |

## Aplicar

Desde `ms-business/` (usa su `.env` + `pg`):

```bash
node ../ms-security/db/apply-v1.cjs
node ../ms-security/db/apply-v2.cjs
node ../ms-security/db/apply-v3.cjs
node ../ms-security/db/apply-v4.cjs
```

Scripts idempotentes donde aplica (`ON CONFLICT` / `ALTER` seguro).

### Internal Key (asignación de roles / directorio)

ms-business y ms-messages llaman:

- `POST /api/internal/user-role/user/{userId}/role-name/{ROLE}`
- `GET /api/internal/users`

con header `X-Internal-Key` = `MS_SECURITY_INTERNAL_KEY` (mismo valor en los tres servicios).

### Contar permisos por rol

```sql
select r.name, count(rp.id) as n
from security.roles r
left join security.role_permissions rp on rp.role_id = r.id
group by r.name
order by r.name;
```

### Smoke

1. Sin `X-Internal-Key` → `POST /api/internal/user-role/...` **401**.
2. Con key → assign rol OK.
3. Sin JWT → `GET /api/users` **401**.
4. Login BCrypt + 2FA (notifications caído) → challenge **200**.
5. `POST /api/public/security/refresh-token` tras promote → JWT con rol nuevo.

Ver matriz completa en [docs/ROLES.md](../../docs/ROLES.md).

## Nota

ms-security: Spring Data JPA + schema `security`.
ms-messages no usa la tabla permissions para chat (JWT + `persons` + `@Roles('ADMIN')`).
