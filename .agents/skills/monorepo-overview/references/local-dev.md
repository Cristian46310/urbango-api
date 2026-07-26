# Desarrollo local

## Orden sugerido al levantar el stack

1. **PostgreSQL / Supabase** — schema `security` (ms-security) + `public` (ms-business/messages).
2. **ms-notifications** — puerto 8000; necesario para 2FA / emails.
3. **ms-security** — puerto 8080; sin él, ms-business no valida JWT.
4. **ms-business** — puerto 3000.
5. **ms-messages** — puerto 3001 (opcional).

## ms-security

```bash
cd ms-security
cp .env.example .env   # editar DB_URL, JWT_SECRET, etc.
./mvnw spring-boot:run
```

Variables mínimas: `DB_URL`, `JWT_SECRET`, `MS_NOTIFICATION_URL`, `MS_SECURITY_INTERNAL_KEY`.

Health: http://localhost:8080/api/health  
Swagger: http://localhost:8080/swagger-ui/index.html

Ver [SETUP-LOCAL.md](../../../ms-security/SETUP-LOCAL.md).

## ms-business

```bash
cd ms-business
cp .env.example .env   # editar DB_URL, MS_SECURITY_URL
pnpm install
pnpm run start:dev
```

Swagger: http://localhost:3000/docs

## ms-notifications

```bash
cd ms-notifications
cp .env.example .env
mkdir -p secrets
# Colocar client_secret_*.json en secrets/
uv sync
uv run fastapi dev --host 0.0.0.0 --port 8000
```

## Docker Compose

Desde la raíz:

```bash
docker compose up -d --build ms-security ms-notifications ms-messages
```

`ms-business` no está en compose actual; ejecutar con pnpm localmente.

- Security: `8080`, Postgres vía `DB_URL`, health `/api/health`.
- Notifications: `8000`, secrets montados en `/run/secrets`.
- Messages: `3001`, depende de ms-security healthy.

## Verificación rápida

```bash
curl -s http://localhost:8080/api/health
curl -s http://localhost:8000/api/email/health
curl -s http://localhost:3000/
```

## CI por microservicio

| MS | Workflow |
|----|----------|
| ms-security | `.github/workflows/ms-security.yml` — `./mvnw clean verify` |
| ms-notifications | `.github/workflows/ms-notifications.yml` — ruff check/format |
| ms-business | `.github/workflows/ms-business.yml` — pnpm lint, test, build |

Ver también `.github/AI_CONTEXT.md`.
