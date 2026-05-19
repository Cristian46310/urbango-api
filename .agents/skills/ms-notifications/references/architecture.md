# Arquitectura y estilo de código — ms-notifications

## Stack (frameworks y librerías)

| Tecnología | Uso |
|------------|-----|
| **FastAPI** | App HTTP, validación automática, `/docs` |
| **Python 3.12** | Runtime |
| **uv** | Gestor de proyecto y lockfile (`uv.lock`) |
| **uvicorn** | ASGI server (`fastapi dev` / Docker) |
| **Pydantic** | DTOs en `app/DTOs/` |
| **Gmail API** | Envío OAuth2 en `email_service.py` |
| **Ruff** | Lint + format (CI y script local) |

## Capas

```
ms-notifications/
├── main.py                 # FastAPI app, CORS, routers
├── app/
│   ├── routes/email.py     # Endpoints async (thin)
│   ├── services/email_service.py  # Gmail, adjuntos
│   └── DTOs/               # EmailDTO, EmailResponseDTO
├── secrets/                # client_secret_*.json (gitignored)
└── pyproject.toml
```

## Flujo de una petición

1. **Router** (`APIRouter`) valida body contra `EmailDTO` (Pydantic).
2. **EmailService** construye mensaje Gmail, adjuntos opcionales desde `files`.
3. Respuesta `EmailResponseDTO` o `HTTPException` 500 con detalle.

## Convenciones de código

- Handlers **`async def`** en rutas.
- DTOs con nombres estables: `to`, `subject`, `body`, `files?` — mismos campos que consumen Java/Nest.
- No loguear tokens OAuth ni rutas de `client_secret`.
- Errores de negocio en service → dict `{ success, error }` → router decide status HTTP.

## Contrato HTTP

| Método | Ruta |
|--------|------|
| POST | `/api/email/send` |
| GET | `/api/email/health` |

`MS_NOTIFICATION_URL` en otros MS = URL **completa** del send, p. ej. `http://127.0.0.1:8000/api/email/send`.

## Swagger / OpenAPI

FastAPI genera documentación automática:

- UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

No requiere JWT; el servicio es interno entre microservicios (proteger en red/producción vía infra, no en esta skill).
