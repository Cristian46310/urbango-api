# Auth y roles — ms-business

## Flujo

1. Cliente envía `Authorization: Bearer <jwt>`.
2. `JwtAuthGuard` extrae el token y llama a `JwtValidationService.validateToken()`.
3. POST a `{MS_SECURITY_URL}/api/public/security/validate-token`.
4. Se construye `JwtPayload` y se adjunta al request para `@CurrentUser()`.

## JwtPayload

```typescript
interface JwtPayload {
  id: string;       // MongoDB user id (ms-security)
  name: string;
  email: string;
  roles: string[];
  createdAt: number;
}
```

Ubicación: `src/auth/types/index.ts`.

## Decoradores

| Decorador | Uso |
|-----------|-----|
| `@CurrentUser()` | Inyecta `JwtPayload` en el handler |
| `@Roles('DRIVER', ...)` | Metadata para `RolesGuard` |
| `@UseGuards(JwtAuthGuard, RolesGuard)` | Protege el endpoint |

## Roles conocidos

| Rol | Uso en código |
|-----|----------------|
| `DRIVER` | `POST /incident-reports/driver` |

Los nombres deben coincidir con los roles en MongoDB (ms-security). Verificar mayúsculas/minúsculas al asignar roles.

## User ID mapping

Cuando ms-security devuelve `postgresUuid` en validate-token, `UserIdMappingService` persiste el vínculo entre:

- `securityUserId` — ObjectId string
- `postgresUuid` — UUID en tablas locales

Entidad: `shared/entities/user-id-mapping.entity.ts`.

## Variables

| Variable | Default |
|----------|---------|
| `MS_SECURITY_URL` | `http://localhost:8080` |

## Errores

`JwtValidationService` convierte fallos de red o 401 de security en `HttpException` 401 con cuerpo:

```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

## Extender protección a nuevos endpoints

1. Importar guards y decoradores desde `@/auth/...`.
2. Añadir `@ApiBearerAuth()` en Swagger si aplica.
3. Registrar guards en el módulo (`providers`) si Nest no los resuelve por inyección global.
