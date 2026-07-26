# Schema SQL — ms-security (Supabase)

Scripts versionados del schema PostgreSQL `security` (mismo proyecto Supabase que ms-business / `public`).

| Archivo | Contenido |
|---------|-----------|
| `V1__security_schema.sql` | Schema, tablas core + OAuth/2FA placeholders, seed de roles (`password` nullable) |
| `V2__seed_permissions.sql` | Permisos RBAC ms-business + admin security base |
| `V3__users_password_nullable.sql` | `ALTER` password nullable (si V1 viejo ya aplicado) |
| `V4__admin_users_roles_permissions.sql` | Permisos `/users` y `/user-role` para ADMIN |
| `V5__drop_security_profiles.sql` | Elimina `security.profiles` y permisos `/profiles` (perfil de dominio = ms-business `persons`) |
| `V6__citizen_driver_admin_permissions.sql` | Permisos ADMIN para listar/CRUD `/citizen` y `/driver` |
| `V7__address_admin_permissions.sql` | Permisos ADMIN para listar/CRUD `/address` |
| `V8__admin_domain_list_permissions.sql` | Permisos ADMIN para `/payment-method-citizen`, `/supervisor`, `/ticket`, `/turn`, mutaciones `/payment-method` |
| `V9__drop_microsoft_oauth.sql` | Elimina tablas `microsoft_*` (OAuth Microsoft retirado) |
| `V10__drop_unused_tables.sql` | Elimina `microsoft_*`, `google_*` placeholders y `sessions` (JWT stateless) |

## Aplicar

Desde `ms-business/` (usa su `.env` + `pg`):

```bash
node ../ms-security/db/apply-v1.cjs
node ../ms-security/db/apply-v2.cjs
node ../ms-security/db/apply-v3.cjs
node ../ms-security/db/apply-v4.cjs
node ../ms-security/db/apply-v5.cjs
node ../ms-security/db/apply-v6.cjs
node ../ms-security/db/apply-v7.cjs
node ../ms-security/db/apply-v8.cjs
node ../ms-security/db/apply-v9.cjs
node ../ms-security/db/apply-v10.cjs
```

Inspección solo lectura:

```bash
node ../ms-security/db/inspect-security-schema.cjs
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
