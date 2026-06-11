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
  "id": "<mongoObjectId>",
  "name": "Juan Pérez",
  "email": "juan@ucaldas.edu.co",
  "userId": "<mongoObjectId>",
  "roles": ["DRIVER", "ADMIN"]
}
```

**Implementación consumidor:** `ms-business/src/auth/services/jwt-validation.service.ts` mapea a `JwtPayload` (`id`, `name`, `email`, `roles`, `createdAt`). Si la respuesta incluye `postgresUuid`, se persiste en `user_id_mapping`.

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

## 3. Variables de entorno compartidas

| Variable | Usado en | Descripción |
|----------|----------|-------------|
| `MS_SECURITY_URL` | ms-business | Base URL de ms-security (default `http://localhost:8080`) |
| `MS_NOTIFICATION_URL` | ms-security, ms-business, ms-ai | URL completa del endpoint send |
| `JWT_SECRET` | ms-security | Firma de tokens (no duplicar lógica en business) |
| `MONGO_URI` / `MONGO_DATABASE` | ms-security | MongoDB |
| `DB_URL` | ms-business | PostgreSQL (Supabase pooler u otro) |

---

## 4. Mapeo de IDs de usuario

| Origen | Formato | Uso |
|--------|---------|-----|
| ms-security | MongoDB ObjectId string | JWT `id`, `currentUser.id` en incidentes |
| ms-business | UUID PostgreSQL | PKs locales en tablas de negocio |

Entidad: `ms-business/src/shared/entities/user-id-mapping.entity.ts`  
Servicio: `UserIdMappingService` — sincroniza cuando validate-token devuelve `postgresUuid`.

---

## 5. Autorización por URL (ms-business → ms-security)

**Request**

```
POST {MS_SECURITY_URL}/api/public/security/authorize
Authorization: Bearer <jwt>
Content-Type: application/json

{ "method": "GET", "url": "/dashboard/payment-method-income" }
```

`SecurityGuard` envía `method` y `url` (sin query string). ms-security compara con permisos MongoDB (patrones exactos o prefijo `/*`).

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
