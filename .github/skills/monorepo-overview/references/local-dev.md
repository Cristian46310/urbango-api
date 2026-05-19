# Desarrollo local

## Orden sugerido al levantar el stack

1. **MongoDB** — Atlas o local (ms-security).
2. **ms-security** — puerto 8080; sin él, ms-business no valida JWT.
3. **ms-notifications** — puerto 8000; opcional salvo flujos de email/incidentes.
4. **PostgreSQL** — requerido para ms-business (`DB_URL`).
5. **ms-business** — puerto 3000.

## ms-security

```bash
mkdir -p ~/.config/ms-security
# Copiar variables desde ms-security/.env.example
cd ms-security && ./mvnw spring-boot:run
```

Variables mínimas: `MONGO_URI`, `MONGO_DATABASE`, `JWT_SECRET`, `MS_NOTIFICATION_URL`.

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
docker compose up -d --build ms-security ms-notifications
```

`ms-business` no está en compose actual; ejecutar con pnpm localmente.

- Security: `8080`, env desde `./.env` en raíz.
- Notifications: `8000`, secrets montados en `/run/secrets`.

## Verificación rápida

```bash
curl -s http://localhost:8080/actuator/health
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
