# Probar la API con Swagger — ms-notifications

## URLs

| Recurso | URL local |
|---------|-----------|
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| OpenAPI JSON | `http://localhost:8000/openapi.json` |

Generadas automáticamente por FastAPI desde tipos Pydantic y docstrings de rutas.

## Arrancar

```bash
cd ms-notifications
uv sync
uv run fastapi dev --host 0.0.0.0 --port 8000
```

Gmail OAuth: credenciales en `secrets/` (ver [gmail-oauth-setup.md](gmail-oauth-setup.md)).

## Probar envío de correo

1. Abre `http://localhost:8000/docs`.
2. **POST /api/email/send** → **Try it out**.
3. Body de ejemplo:

```json
{
  "to": "destino@example.com",
  "subject": "Prueba",
  "body": "Cuerpo del mensaje",
  "files": []
}
```

4. **Execute** — éxito: `200` con `success: true` y `message_id`.

**GET /api/email/health** — comprobar que el router responde sin llamar a Gmail.

## Integración desde otros MS

ms-security y ms-business envían el mismo JSON vía HTTP POST; probar primero en Swagger local antes de depurar llamadas desde Java/Nest.

## Checklist

- [ ] `/docs` carga
- [ ] `/api/email/health` → `{"status":"ok",...}`
- [ ] Send con credenciales Gmail válidas (o error 500 documentado en respuesta)
