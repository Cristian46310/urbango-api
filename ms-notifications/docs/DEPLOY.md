# Despliegue de ms-notifications

> **Nota:** Docker no está implementado aún. Usar el arranque local descrito abajo.

## Arranque en producción (manual)

```bash
cd ms-notifications
cp .env.example .env
# Configurar SECRETS_LOCATION, EMAIL, CLIENT_SECRET
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

## Requisitos

- Python 3.12+ con [uv](https://docs.astral.sh/uv/)
- Archivo OAuth de Google en `secrets/` (no versionar)
- Variables en `.env` — ver [README](../README.md)

## Health

```bash
curl -s http://localhost:8000/api/email/health
```

## Planificado

- `Dockerfile` y entrada en `docker-compose.yml` del monorepo.
- Montaje read-only de `secrets/` en contenedor.
