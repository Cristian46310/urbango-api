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

FastAPI + uv + Python 3.12. Puerto **8000**.

## Estructura

```
ms-notifications/
├── main.py                 # App FastAPI, CORS, include_router
├── app/
│   ├── routes/email.py     # POST send, GET health
│   ├── services/email_service.py
│   └── DTOs/
│       ├── email_dto.py
│       └── email_response_dto.py
├── secrets/                # NO en git — client_secret_*.json
├── pyproject.toml
└── uv.lock
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Info servicio |
| POST | `/api/email/send` | Envía correo |
| GET | `/api/email/health` | Health del servicio email |

Detalle y ejemplos: [references/api-catalog.md](references/api-catalog.md).

## Contrato para consumidores (Java/Nest)

Body JSON alineado con `EmailDTO`:

```json
{
  "to": "user@example.com",
  "subject": "Asunto",
  "body": "Texto",
  "files": ["/path/opcional"]
}
```

`MS_NOTIFICATION_URL` en otros MS debe ser la URL **completa** del send, ej. `http://127.0.0.1:8000/api/email/send`.

## Desarrollo

```bash
cd ms-notifications
uv sync
uv run fastapi dev --host 0.0.0.0 --port 8000
```

Scripts: `scripts/dev.sh`, `scripts/lint.sh`.

## Calidad (CI)

Mismo que GitHub Actions:

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
| [api-catalog.md](references/api-catalog.md) | API y errores |
| [gmail-oauth-setup.md](references/gmail-oauth-setup.md) | Google Cloud / OAuth |
| [env-vars.md](references/env-vars.md) | Variables |

README humano: `ms-notifications/README.md`, deploy: `docs/DEPLOY.md`.
