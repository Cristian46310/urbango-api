---
name: ms-notifications
description: >-
  Microservicio FastAPI para envío de correos vía Gmail API (OAuth2). Endpoints
  /api/email/send y health. Consumido por ms-security y ms-business. Usar al
  editar ms-notifications/, email, DTOs Python, uv, Ruff o configuración Gmail.
paths:
  - ms-notifications/**
---

# ms-notifications

**FastAPI** + **uv** + **Python 3.12**. Puerto **8000**.

## Frameworks y dependencias clave

| Componente | Detalle |
|------------|---------|
| FastAPI | App ASGI, validación Pydantic, `/docs` automático |
| uvicorn | Servidor (`uv run fastapi dev`) |
| uv | Lockfile, entornos, `uv sync` |
| Pydantic | DTOs en `app/DTOs/` |
| Gmail API | OAuth2 en `email_service.py` |
| Ruff | Lint + format (CI) |

## Arquitectura

```
main.py → app/routes/ → app/services/ → Gmail API
              ↓
         app/DTOs/ (Pydantic)
```

- **Routes:** handlers `async`, sin lógica Gmail.
- **Services:** envío, adjuntos, manejo de errores Gmail.
- **DTOs:** contrato estable para Java/Nest.

Detalle: [references/architecture.md](references/architecture.md).

## Estilo de código

- Rutas **async**; tipado con modelos Pydantic.
- Campos API: `to`, `subject`, `body`, `files?` (lista opcional de rutas).
- No loguear tokens OAuth ni `client_secret`.
- `secrets/` y `.env` fuera de git.

## Swagger (probar la API)

| Recurso | URL |
|---------|-----|
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |

Sin JWT. Probar `POST /api/email/send` y `GET /api/email/health` desde la UI.

Guía: [references/swagger-testing.md](references/swagger-testing.md).

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Info servicio |
| POST | `/api/email/send` | Envía correo |
| GET | `/api/email/health` | Health email |

Body JSON (alineado con consumidores):

```json
{
  "to": "user@example.com",
  "subject": "Asunto",
  "body": "Texto",
  "files": []
}
```

`MS_NOTIFICATION_URL` en otros MS = URL **completa** del send, ej. `http://127.0.0.1:8000/api/email/send`.

Detalle: [references/api-catalog.md](references/api-catalog.md).

## Desarrollo

```bash
cd ms-notifications
uv sync
uv run fastapi dev --host 0.0.0.0 --port 8000
```

Scripts: `scripts/dev.sh`, `scripts/lint.sh`.

## Verificación local (agentes)

**Rápida** — lint (Ruff):

```bash
./.agents/skills/ms-notifications/scripts/lint.sh
```

Equivalente manual:

```bash
uv run ruff check .
uv run ruff format --check .
```

## Docker

- `Dockerfile` en raíz del MS.
- Compose monta `./ms-notifications/secrets` → `/run/secrets`.

## Referencias

| Archivo | Contenido |
|---------|-----------|
| [architecture.md](references/architecture.md) | Capas y convenciones |
| [swagger-testing.md](references/swagger-testing.md) | Probar `/docs` |
| [api-catalog.md](references/api-catalog.md) | API y errores |
| [gmail-oauth-setup.md](references/gmail-oauth-setup.md) | Google Cloud |
| [env-vars.md](references/env-vars.md) | Variables |

README: `ms-notifications/README.md`. Deploy: `docs/DEPLOY.md`.
