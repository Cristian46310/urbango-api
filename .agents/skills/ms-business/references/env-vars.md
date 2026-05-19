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
| `SUPABASE_INCIDENT_BUCKET` | Bucket fotos (ej. `incident-report`) |
| `INCIDENT_SUPERVISOR_EMAIL` | Fallback si enterprise no tiene supervisor |

## Ejemplo

Ver `ms-business/.env.example`:

```env
PORT=3000
DB_URL=postgresql://...
```

README del módulo incidentes documenta el bloque Supabase + notificaciones.

## ePayco (recarga tarjeta — HU-ENTR-2-013)

| Variable | Descripción |
|----------|-------------|
| `EPAYCO_PUBLIC_KEY` | Llave pública Apify |
| `EPAYCO_PRIVATE_KEY` | Llave privada Apify |
| `EPAYCO_CUSTOMER_ID` | Customer ID (validación webhook) |
| `EPAYCO_P_KEY` | P_KEY (validación webhook) |
| `EPAYCO_TEST_MODE` | `true` en sandbox (default) |
| `EPAYCO_FEE_PERCENT` | Comisión mostrada al usuario (default 2.99) |
| `EPAYCO_MERCHANT_NAME` | Nombre en checkout |
| `MS_BUSINESS_PUBLIC_URL` | URL pública del API (webhook) |
| `FRONTEND_URL` | URL base del frontend (página de respuesta) |
| `EPAYCO_CONFIRMATION_URL` | Opcional: override URL webhook |
| `EPAYCO_RESPONSE_URL` | Opcional: override URL de retorno usuario |

## Seguridad

- No commitear `.env`.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor, nunca en frontend.
- `EPAYCO_PRIVATE_KEY` y `EPAYCO_P_KEY` solo en servidor.
