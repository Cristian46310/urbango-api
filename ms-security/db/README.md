# Schema SQL — ms-security (Supabase)



Un solo archivo define el schema PostgreSQL `security` (mismo proyecto Supabase que ms-business / `public`).



| Archivo | Contenido |

|---------|-----------|

| `schema.sql` | Tablas, índices, roles seed y permisos RBAC completos |



## Aplicar



Desde la raíz del repo:



```bash

node scripts/sql-migrate.cjs ms-security

```



Atajo:



```bash

node ms-security/db/migrate.cjs

```



Requisitos: `ms-business/.env` con `DB_URL` y `pnpm install` en `ms-business/`.



El runner ejecuta **solo** `schema.sql` una vez (registro en `public.db_migrations`). Si cambias el esquema, edita `schema.sql` y usa una nueva versión — ver [docs/DATABASE.md](../../docs/DATABASE.md).



## Inspección



```bash

node ms-security/db/inspect-security-schema.cjs

```



Ver matriz de roles en [docs/ROLES.md](../../docs/ROLES.md).

