# ms-security

Spring Boot 4 + Java 17 + JPA/PostgreSQL (schema `security`). Puerto **8080**.

## Variables de entorno

Copia `.env.example` → `ms-security/.env` (también se puede usar `.env` en la raíz del monorepo vía Docker Compose).

`application.properties` importa:

```text
optional:file:.env[.properties]
optional:file:./ms-security/.env[.properties]
```

| Variable | Requerida | Notas |
|----------|-----------|-------|
| `DB_URL` | sí | JDBC Supabase/Postgres + `currentSchema=security` |
| `DB_USERNAME` / `DB_PASSWORD` | sí* | Pooler Supabase |
| `JWT_SECRET` | sí | ≥32 caracteres |
| `MS_SECURITY_INTERNAL_KEY` | sí (integraciones) | Header `X-Internal-Key` |
| `MS_NOTIFICATION_URL` | para 2FA/emails | URL completa de send |
| Google / GitHub / reCAPTCHA | según flujos | Ver `.env.example` |

\* En local pueden ir vacíos si `DB_URL` ya incluye credenciales; con Supabase pooler suele hacer falta usuario/password.

## Arranque

```bash
cd ms-security
./mvnw spring-boot:run
```

- Swagger: http://localhost:8080/swagger-ui/index.html
- Health: http://localhost:8080/api/health

Setup paso a paso: [SETUP-LOCAL.md](SETUP-LOCAL.md).

## Auth (resumen)

1. `POST /api/public/security/login` → challenge 2FA (email)
2. `POST /api/public/security/verify-2fa` → JWT
3. Passwords: **BCrypt**

OAuth: Google (`login/google`) y GitHub (`login/github/*` / `/github/*`).
