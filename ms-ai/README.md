# ms-ai

Microservicio FastAPI (puerto **8001**) de automatización inteligente: citas, PQRS/soporte, clima y recordatorios de ruta.

## Requisitos

- Python 3.11+
- PostgreSQL (`DATABASE_URL`)
- Scripts SQL en `sql/` (ejecutar manualmente)

## Arranque

```bash
cd ms-ai
uv sync   # o pip install -e .
cp .env.example .env   # si existe
uvicorn main:app --reload --port 8001
```

Docs: http://127.0.0.1:8001/docs

## Variables relevantes

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres ms_ai |
| `MS_NOTIFICATION_URL` | Email via ms-notifications |
| `MS_BUSINESS_URL` | Base ms-business |
| `MS_BUSINESS_INTERNAL_KEY` | Mismo valor que `MS_INTERNAL_API_KEY` en business |
| `OPENWEATHER_API_KEY` | Clima |
| `OLLAMA_*` / `GEMINI_*` | LLM |

Ver `docs/ARCHITECTURE.md` y monorepo `inter-service-contracts.md`.
