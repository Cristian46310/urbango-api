# Variables de entorno — ms-security

## Ubicación del archivo

```
ms-security/.env
```

También: `optional:file:.env` / `./ms-security/.env` vía `spring.config.import`.

## PostgreSQL (Supabase schema `security`)

| Variable | Property |
|----------|----------|
| `DB_URL` | `spring.datasource.url` (JDBC + `currentSchema=security`) |
| `DB_USERNAME` | `spring.datasource.username` (`postgres.<project-ref>` en pooler) |
| `DB_PASSWORD` | `spring.datasource.password` |

Usar **pooler IPv4** (`aws-0-<region>.pooler.supabase.com:6543`), no el host `db.*` si la red no tiene IPv6.

## JWT

| Variable | Property |
|----------|----------|
| `JWT_SECRET` | `jwt.secret` |

## Notificaciones

| Variable | Property |
|----------|----------|
| `MS_NOTIFICATION_URL` | `notifications.url` |

Ejemplo: `http://127.0.0.1:8000/api/email/send`

## Google OAuth / GitHub / Recaptcha

Ver `.env.example`. Pueden ir placeholders hasta activar esos flujos.

## Servidor

| Variable | Notas |
|----------|-------|
| `SERVER_PORT` | Default 8080 |

Setup paso a paso: [SETUP-LOCAL.md](../../../ms-security/SETUP-LOCAL.md) (desde la skill: `ms-security/SETUP-LOCAL.md`).
