# Base de datos y migraciones

Guía única para crear esquemas y ejecutar migraciones en el monorepo.

## Resumen por servicio

| Servicio | Base de datos | Herramienta | Comando |
|----------|---------------|-------------|---------|
| **ms-security** | Supabase/Postgres, schema `security` | SQL versionado (`db/V*.sql`) | `node scripts/sql-migrate.cjs ms-security` |
| **ms-business** | Misma BD, schema `public` | TypeORM | `pnpm run migration:run` (desde `ms-business/`) |
| **ms-messages** | Misma BD que business | TypeORM | `pnpm run migration:run` (desde `ms-messages/`) |
| **ms-ai** | BD separada `ms_ai` | SQL numerado (`sql/NNN_*.sql`) | `node scripts/sql-migrate.cjs ms-ai` |
| **ms-notifications** | — | Sin BD | — |

## Comando único (recomendado)

Desde la raíz del repositorio, aplica **todas** las migraciones en el orden correcto:

```bash
node scripts/db-migrate.cjs
```

En Linux/macOS/Git Bash:

```bash
./scripts/db-migrate.sh
```

Solo un subconjunto:

```bash
node scripts/db-migrate.cjs --only ms-security
node scripts/db-migrate.cjs --only ms-business,ms-messages
node scripts/db-migrate.cjs --only ms-ai
```

### Orden obligatorio (BD compartida)

1. **ms-security** — crea schema `security` (roles, permisos, usuarios).
2. **ms-business** — tablas de dominio en `public`.
3. **ms-messages** — tablas de chat/alertas en `public` (depende de `persons`, etc.).
4. **ms-ai** — BD independiente (`DATABASE_URL`).

## Variables de entorno

| Servicio | Archivo | Variable |
|----------|---------|----------|
| ms-security, ms-business, ms-messages | `ms-business/.env` | `DB_URL` |
| ms-ai | `ms-ai/.env` | `DATABASE_URL` (default local: `postgresql://postgres:postgres@localhost:5432/ms_ai`) |

**Requisito:** ejecutar `pnpm install` en `ms-business/` antes de cualquier migración SQL (usa la dependencia `pg`).

## Migraciones SQL (ms-security, ms-ai)

Cada servicio SQL tiene **un único archivo** `schema.sql`:

| Servicio | Archivo |
|----------|---------|
| ms-security | `ms-security/db/schema.sql` |
| ms-ai | `ms-ai/sql/schema.sql` |

Comando:

```bash
node scripts/sql-migrate.cjs ms-security
node scripts/sql-migrate.cjs ms-ai
```

El runner lo ejecuta una sola vez y registra `version = schema` en `public.db_migrations`.

**Cambios futuros de esquema:** editar `schema.sql` y, si la BD ya tenía el schema aplicado, registrar manualmente el cambio o incrementar la versión en el runner (ver nota abajo).

Atajos:

```bash
node ms-security/db/migrate.cjs
node ms-ai/scripts/migrate.cjs
```

## Migraciones TypeORM (ms-business, ms-messages)

- `synchronize: false` — el esquema **no** se auto-genera al arrancar NestJS.
- Historial en tabla `migrations` (TypeORM).
- Generar nueva migración (solo ms-business, ejemplo):

```bash
cd ms-business
npx typeorm-ts-node-commonjs migration:generate src/migrations/NombreCambio -d typeorm.config.ts
```

Revertir última:

```bash
cd ms-business
npx typeorm-ts-node-commonjs migration:revert -d typeorm.config.ts
```

## Bootstrap local (primera vez)

```bash
# 1. Dependencias Node compartidas para migradores SQL
cd ms-business && pnpm install && cp .env.example .env   # editar DB_URL

# 2. Todas las migraciones
cd ..
node scripts/db-migrate.cjs

# 3. ms-ai (si usas el servicio)
cd ms-ai && cp .env.example .env   # editar DATABASE_URL si aplica
cd .. && node scripts/db-migrate.cjs --only ms-ai
```

## Inspección (ms-security)

```bash
node ms-security/db/inspect-security-schema.cjs
```

## CI

Los workflows de GitHub **no** ejecutan migraciones automáticamente. En CI/CD futuro, usar `node scripts/db-migrate.cjs` contra la BD del entorno.
