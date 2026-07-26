# Setup local esencial — ms-security + ms-notifications

## Ya hecho en el repo / Supabase

- Schema `security` + tablas + roles seed (`ms-security/db/V1__security_schema.sql`)
- ms-security migrado de Mongo → **JPA + PostgreSQL**
- `ms-security/.env` y `ms-notifications/.env` (plantilla) creados localmente (no se commitean)

## 1. Requisitos

- JDK 17+
- Node/pnpm (ms-business, opcional)
- Python 3.12 + `uv` (ms-notifications)
- Proyecto Supabase ya creado (mismo de business)

## 2. ms-security `.env`

Archivo: `ms-security/.env` (basado en `.env.example`)

| Variable | Qué poner |
|----------|-----------|
| `DB_URL` | JDBC pooler + `prepareThreshold=0` (evita choque de prepared statements con PgBouncer) |
| `DB_USERNAME` | `postgres.<project-ref>` |
| `DB_PASSWORD` | Password del proyecto Supabase |
| `JWT_SECRET` | String largo (≥32 chars) |
| `MS_NOTIFICATION_URL` | `http://127.0.0.1:8000/api/email/send` |
| Google / reCAPTCHA / OAuth | Placeholders `unused` o vacíos hasta activarlos |

Arrancar:

```bash
cd ms-security
./mvnw spring-boot:run
```

Swagger: http://localhost:8080/swagger-ui/index.html

## 3. ms-notifications `.env`

```bash
cd ms-notifications
# .env ya puede existir; edítalo:
```

| Variable | Qué poner |
|----------|-----------|
| `SCOPES` | `https://www.googleapis.com/auth/gmail.send` |
| `SECRETS_LOCATION` | `./secrets` |
| `EMAIL` | Tu Gmail del servicio |
| `CLIENT_SECRET` | `./secrets/client_secret_....json` |

Pasos Gmail:

1. Google Cloud Console → OAuth Desktop + Gmail API
2. Descargar JSON → `ms-notifications/secrets/client_secret_....json`
3. `uv sync`
4. `uv run uvicorn app.main:app --reload --port 8000`
5. Primera vez: completar OAuth en consola (genera token)

Health: http://localhost:8000/api/email/health

## 4. Orden de arranque

1. ms-notifications (`:8000`) — si vas a emails
2. ms-security (`:8080`)
3. ms-business (`:3000`) — ya tiene `.env` con Supabase + role IDs

## 5. Probar lo básico

1. `POST /api/public/security/register` (o crear usuario)
2. `POST /api/public/security/login` — si pide reCAPTCHA, configura keys reales o ajusta el flujo después
3. `POST /api/public/security/validate-token` con Bearer JWT
4. En Table Editor de Supabase → schema `security` → tabla `users`

## Notas

- **No uses Mongo** para security: ya no está en el `pom.xml`.
- OAuth Google/GitHub: requieren Client ID/Secret en `.env`.
- Rota la password de DB si se expuso en chat.
