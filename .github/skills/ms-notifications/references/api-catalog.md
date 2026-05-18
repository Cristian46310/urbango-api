# Catálogo API — ms-notifications

Base local: `http://localhost:8000`  
Swagger: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

## Raíz

| Método | Ruta | Response |
|--------|------|----------|
| GET | `/` | `{ "service", "version", "status" }` |

## Email router — prefijo `/api/email`

| Método | Ruta | Body | Response |
|--------|------|------|----------|
| POST | `/send` | `EmailDTO` | `EmailResponseDTO` |
| GET | `/health` | — | `{ "status": "ok", "service": "email-service" }` |

### EmailDTO

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `to` | string | sí |
| `subject` | string | sí |
| `body` | string | sí |
| `files` | list[string] | no — rutas locales de adjuntos |

### EmailResponseDTO (éxito)

| Campo | Tipo |
|-------|------|
| `success` | bool |
| `message_id` | string opcional |
| `message` | string |

### Errores

- Fallo en envío → HTTP 500 con `detail` del error Gmail/servicio.
- Validación Pydantic → 422 automático FastAPI.

## Ejemplo curl

```bash
curl -X POST "http://localhost:8000/api/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "usuario@example.com",
    "subject": "Prueba",
    "body": "Mensaje de prueba"
  }'
```

## Consumidores en el monorepo

- **ms-security:** `notifications.url` en `application.properties`
- **ms-business:** `MS_NOTIFICATION_URL` para incidentes y notificaciones supervisor

No cambiar nombres de campos (`to`, `subject`, `body`) sin actualizar ambos consumidores y `inter-service-contracts.md`.
