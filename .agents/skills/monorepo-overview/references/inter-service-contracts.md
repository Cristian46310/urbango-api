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

## 3. Variables de entorno compartidas

| Variable | Usado en | Descripción |
|----------|----------|-------------|
| `MS_SECURITY_URL` | ms-business | Base URL de ms-security (default `http://localhost:8080`) |
| `MS_NOTIFICATION_URL` | ms-security, ms-business | URL completa del endpoint send |
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

## 5. Roles relevantes en ms-business

- `DRIVER` — requerido en `POST /incident-reports/driver` (`@Roles('DRIVER')`).

Los nombres de rol deben coincidir con los definidos en ms-security (mayúsculas según asignación en BD).
