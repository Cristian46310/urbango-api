# Variables de entorno — ms-business

## Obligatorias

| Variable | Descripción |
|----------|-------------|
| `DB_URL` | Connection string PostgreSQL |
| `PORT` | Puerto HTTP (default 3000) |

## Integraciones

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MS_SECURITY_URL` | Base URL ms-security | `http://localhost:8080` |
| `MS_NOTIFICATION_URL` | URL completa POST email | — |

## Incidentes / Supabase

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role |
| `SUPABASE_BUS_BUCKET` | Bucket fotos de flota (ej. `bus-photo`) |
| `SUPABASE_INCIDENT_BUCKET` | Bucket fotos de incidentes (ej. `incident-report`) |
| `INCIDENT_SUPERVISOR_EMAIL` | Fallback si enterprise no tiene supervisor |

## Ejemplo

Ver `ms-business/.env.example`:

```env
PORT=3000
DB_URL=postgresql://...
```

README del módulo incidentes documenta el bloque Supabase + notificaciones.

## Seguridad

- No commitear `.env`.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor, nunca en frontend.
