# Contratos entre microservicios

## 1. Validación de JWT (ms-business → ms-security)

**Request**

```
POST {MS_SECURITY_URL}/api/public/security/validate-token
Authorization: Bearer <jwt>
Content-Type: application/json
```

**Response 200 (ejemplo)**

```json
{
  "id": "<uuid>",
  "name": "Juan Pérez",
  "email": "juan@ucaldas.edu.co",
  "roles": ["DRIVER", "ADMIN"],
  "createdAt": 1710000000000
}
```

**Implementación consumidor:** `ms-business/src/auth/services/jwt-validation.service.ts` mapea a `JwtPayload` (`id`, `name`, `email`, `roles`, `createdAt`).

**Errores:** 401 con `{ "error": "..." }` → ms-business lanza `HttpException` Unauthorized.

---

## 2. Envío de email (ms-security / ms-business → ms-notifications)

**URL típica:** `MS_NOTIFICATION_URL=http://127.0.0.1:8000/api/email/send`

**Request**

```
POST /api/email/send
Content-Type: application/json
```

```json
{
  "to": "destinatario@example.com",
  "subject": "Asunto",
  "body": "Cuerpo del mensaje",
  "files": ["/ruta/opcional/adjunto.pdf"]
}
```

`files` es opcional (lista de rutas en el servidor de notificaciones).

**Response 200**

```json
{
  "success": true,
  "message_id": "...",
  "message": "Correo enviado exitosamente"
}
```

**DTO Python:** `app/DTOs/email_dto.py` — campos `to`, `subject`, `body`, `files`.

---

## 2b. PQRS automatizado (ms-ai → ms-notifications / Supabase / Slack)

**Base URL ms-ai:** `http://127.0.0.1:8001` (puerto por defecto en `ms-ai/app/config/settings.py`).

### Endpoints PQRS

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/pqrs/` | Crear PQRS (multipart: campos + hasta 3 imágenes) |
| GET | `/api/pqrs/ticket/{ticket_number}` | Consulta pública por radicado |
| GET | `/api/pqrs/{id}` | Detalle por UUID |
| GET | `/api/pqrs/` | Listado con filtros `status`, `category`, `user_email` |
| PUT | `/api/pqrs/{id}` | Actualización admin |
| DELETE | `/api/pqrs/{id}` | Eliminar PQRS |
| POST | `/api/pqrs/{pqrs_id}/updates/` | Cambio de estado (dispara email al usuario) |
| GET | `/api/pqrs/{pqrs_id}/updates/` | Historial de actualizaciones |

### Flujo de notificaciones

1. **Create PQRS** → LangGraph (Ollama → fallback Gemini) redacta emails personalizados.
2. **Usuario** → `POST {MS_NOTIFICATION_URL}` con confirmación (radicado, resumen, SLA).
3. **Departamento** → email según categoría + Slack webhook (config en `department_routing.json`).
4. **Update status** → email al ciudadano (`in_review`, `in_progress`, `resolved`).
5. **SLA vencido** → job periódico alerta a `SUPERVISOR_EMAIL`.

### Supabase Storage (imágenes PQRS)

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | Base URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role |
| `SUPABASE_PQRS_BUCKET` | Bucket (default `pqrs-images`) |

Upload: `POST {SUPABASE_URL}/storage/v1/object/{bucket}/{path}`  
URL pública: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`

### Variables LLM / SLA (ms-ai)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama local |
| `OLLAMA_MODEL` | `llama3.2` | Modelo Ollama |
| `GEMINI_API_KEY` | — | Fallback si Ollama falla |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Modelo Gemini |
| `SUPERVISOR_EMAIL` | `supervisor@ucaldas.edu.co` | Alertas SLA |
| `SLA_CHECK_INTERVAL_SECONDS` | `3600` | Intervalo job SLA |
| `MS_NOTIFICATION_URL` | `http://127.0.0.1:8000/api/email/send` | Mismo contrato sección 2 |

---

## 2c. Alertas de clima (ms-ai → OpenWeatherMap / ms-notifications)

### Endpoints Weather

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/weather/alerts` | Crear alerta de clima (requiere `user_id` en body) |
| GET | `/api/weather/alerts/user/{user_id}` | Listar alertas de un usuario |
| GET | `/api/weather/alerts/{alert_id}` | Consultar alerta por id |
| PUT | `/api/weather/alerts/{alert_id}` | Actualizar alerta por id |
| DELETE | `/api/weather/alerts/{alert_id}` | Desactivar alerta por id |

**Body POST (`CreateWeatherAlertRequest`):**

```json
{
  "user_id": "mongo-user-id",
  "user_email": "ciudadano@example.com",
  "travel_hour": 7,
  "city_name": "Manizales,CO",
  "preferred_channel": "email"
}
```

**Body PUT (`UpdateWeatherAlertRequest`):**

```json
{
  "user_email": "ciudadano@example.com",
  "travel_hour": 7,
  "city_name": "Manizales,CO",
  "preferred_channel": "email"
}
```

`preferred_channel`: `email` | `whatsapp` | `push` (WhatsApp y push son stubs hasta integrar ms-notifications).

### Flujo de alertas

1. Usuario activa alerta con horario de viaje y ciudad (geocodificada vía OpenWeatherMap Geocoding API).
2. Job horario evalúa suscripciones activas y consulta pronóstico por `lat/lon`.
3. Se selecciona el bloque horario más cercano al `travel_hour` usando el `timezone` de la ciudad devuelto por OpenWeatherMap (la API gratuita de 5 días usa pasos de 3 h).
4. LangGraph + LLM genera mensaje personalizado según pronóstico (lluvia > 50% → recomendar salir antes + paraguas).
5. Despacho por canal preferido: email real vía `MS_NOTIFICATION_URL`; WhatsApp/push stub.

### Variables clima (ms-ai)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | — | API key OpenWeatherMap |
| `OPENWEATHER_GEO_URL` | `https://api.openweathermap.org/geo/1.0/direct` | Geocoding |
| `OPENWEATHER_FORECAST_URL` | `https://api.openweathermap.org/data/2.5/forecast` | Pronóstico 5 días / paso 3 h |
| `OPENWEATHER_HOURLY_FORECAST_URL` | `https://api.openweathermap.org/data/2.5/forecast/hourly` | Pronóstico horario (4 días) |
| `OPENWEATHER_FORECAST_MODE` | `three_hour` | `three_hour` o `hourly` |
| `WEATHER_RAIN_THRESHOLD_PERCENT` | `50` | Umbral lluvia para alerta preventiva |
| `WEATHER_ALERT_MAX_HOURS_BEFORE` | `2` | Ventana máxima antes del viaje |
| `WEATHER_CHECK_INTERVAL_SECONDS` | `3600` | Intervalo job horario |
| `WHATSAPP_NOTIFICATION_URL` | — | Stub/futuro endpoint WhatsApp |
| `PUSH_NOTIFICATION_URL` | — | Stub/futuro endpoint push |

### Assessment síncrono (GPS → OpenWeather → risk determinista → NL)

```
POST /api/weather/assess
Content-Type: application/json

{ "lat": 5.07, "lon": -75.51, "travel_hour": 7 }
```

**Response:** `location`, `metrics` (temp, humidity, wind, rain_probability, …), `risk_level` (`low|medium|high` calculado en código), `explanation`, `recommendation` (LangGraph/LLM; no inventa métricas).

| Variable | Default | Descripción |
|----------|---------|-------------|
| `WEATHER_RAIN_THRESHOLD_PERCENT` | `50` | Umbral medium |
| `WEATHER_RAIN_HIGH_THRESHOLD_PERCENT` | `70` | Umbral high |

---

## 2d. ms-ai → ms-business (transporte, solo lectura)

**Principios:** ms-ai solo GET; no replica datos operativos; **no shared DTOs** (JSON + mapper en AI).

### Versionado

Prefijo M2M: `/internal/v1/...`. Breaking → `/internal/v2`. Non-breaking: campos opcionales nuevos en v1.

### Auth (Internal Key)

```
Header: X-Internal-Key: <MS_INTERNAL_API_KEY>
Header: X-Correlation-Id: <uuid>   # opcional, propagado por ms-ai
```

| Variable (ms-business) | Variable (ms-ai) | Notas |
|------------------------|------------------|-------|
| `MS_INTERNAL_API_KEY` | `MS_BUSINESS_INTERNAL_KEY` | Mismo secreto |
| `MS_INTERNAL_API_KEY_PREVIOUS` | — | Ventana dual-key ~7 días al rotar |

**Rotación:** cada ~90 días. Clave no permanente. Durante la ventana, business acepta current + previous.

### Endpoints

```
GET {MS_BUSINESS_URL}/internal/v1/scheduler?date=&routeId=&status=programado&page=&limit=
→ 200 { items: [...], meta }

GET {MS_BUSINESS_URL}/internal/v1/scheduler/:id
→ 200 schedule | 404
```

ms-ai mapea JSON a proyección `RouteSchedule` (`HttpBusinessTransportClient`). No importar DTOs Nest.

### Automatización (ms-ai)

```
POST /api/automation/route-reminders
{ "business_schedule_id": "uuid", "user_id": "...", "user_email": "..." }
→ { reminder_id, calendar_event_id, sync_status, departure_time, route_name }

DELETE /api/automation/route-reminders/{reminder_id}
```

Tabla puente `automation_route_reminders`: solo IDs + `sync_status` (`PENDING|SYNCED|FAILED|CANCELLED`).

### PQRS — categoría soporte técnico

`category` incluye `technical_support`. Si `category` se omite en POST `/api/pqrs`, el LLM sugiere y se valida contra el enum (fallback `other`).

### Decisiones rechazadas (ms-ai)

| Rechazado | Razón |
|-----------|--------|
| Guardar rutas/horarios en ms-ai | Single Source of Truth |
| Package compartido de DTOs | Acopla despliegues |
| JWT de usuario en jobs AI→business | Jobs sin sesión; Internal Key |
| `risk_level` vía LLM | Debe ser reproducible |
| Categorías fuera del enum | Whitelist de dominio |

---

## 3. Variables de entorno compartidas

| Variable | Usado en | Descripción |
|----------|----------|-------------|
| `MS_SECURITY_URL` | ms-business | Base URL de ms-security (default `http://localhost:8080`) |
| `MS_NOTIFICATION_URL` | ms-security, ms-business, ms-ai | URL completa del endpoint send |
| `MS_BUSINESS_URL` | ms-ai | Base URL ms-business |
| `MS_BUSINESS_INTERNAL_KEY` / `MS_INTERNAL_API_KEY` | ms-ai / ms-business | M2M X-Internal-Key |
| `JWT_SECRET` | ms-security | Firma de tokens (no duplicar lógica en business) |
| `DB_URL` | ms-security, ms-business, ms-messages | PostgreSQL (Supabase; security usa schema `security`) |
| `MS_SECURITY_INTERNAL_KEY` | ms-security, ms-business, ms-messages | Header `X-Internal-Key` M2M |

---

## 4. Mapeo de IDs de usuario

| Origen | Formato | Uso |
|--------|---------|-----|
| ms-security | UUID string | JWT `id`, `persons.user_id` en ms-business |
| ms-business | UUID PostgreSQL | PKs locales en tablas de negocio |

El `id` del JWT de security es el mismo UUID que se guarda en `persons.user_id` (no hay ObjectId Mongo).

---

## 5. Autorización por URL (ms-business → ms-security)

**Request**

```
POST {MS_SECURITY_URL}/api/public/security/authorize
Authorization: Bearer <jwt>
Content-Type: application/json

{ "method": "GET", "url": "/dashboard/payment-method-income" }
```

`SecurityGuard` envía `method` y `url` (sin query string). ms-security compara con permisos en PostgreSQL (patrones exactos o prefijo `/*`).

**Dashboard (HU-ENTR-2-014)** — registrar en ms-security y asignar a `BUSINESS_ADMIN` o `ADMIN`:

| method | url |
|--------|-----|
| GET | `/dashboard/payment-method-income` |
| GET | `/dashboard/payment-method-income/export` |

Alternativa: un permiso `GET` `/dashboard/*` para todas las rutas del módulo.

---

## 6. Roles relevantes en ms-business

- `DRIVER` — requerido en `POST /incident-reports/driver` (`@Roles('DRIVER')`).

Los nombres de rol deben coincidir con los definidos en ms-security (mayúsculas según asignación en BD).
