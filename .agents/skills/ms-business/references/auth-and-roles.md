# Auth y roles — ms-business

## Flujo

1. Cliente envía `Authorization: Bearer <jwt>`.
2. `SecurityGuard` (APP_GUARD global) valida el token vía `JwtValidationService.validateToken()`.
3. POST a `{MS_SECURITY_URL}/api/public/security/validate-token`.
4. Se construye `JwtPayload` y se adjunta al request para `@CurrentUser()`.
5. Si la ruta no es `@Public()` ni `@Authenticated()`, llama a `POST /api/public/security/authorize` con `{ method, url }`.
6. Con `@Authenticated()` + `@Roles(...)`, valida roles localmente desde el payload (sin `/authorize`).

## JwtPayload

```typescript
interface JwtPayload {
  id: string;       // UUID del usuario en ms-security (= persons.user_id)
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
| `@Public()` | Sin JWT |
| `@Authenticated()` | JWT válido; omite `/authorize` |
| `@Roles('DRIVER', ...)` | Con `@Authenticated()`: exige uno de los roles |

## Roles conocidos (alineados a `docs/ROLES.md`)

| Rol | Uso en business |
|-----|-----------------|
| `CITIZEN` | Onboarding `POST /citizen`; dashboard realtime |
| `DRIVER` | Perfil `POST /driver` (ya promovido); incidentes; turn |
| `SUPERVISOR` | Perfil supervisor; dashboard ops |
| `BUSINESS_ADMIN` | Ops / dashboard |
| `ADMIN` | Plataforma |

## Vínculo user_id

`persons.user_id` almacena **directamente** el UUID de ms-security. No hay tabla `UserIdMapping` ni puente ObjectId.

## Variables

| Variable | Default |
|----------|---------|
| `MS_SECURITY_URL` | `http://localhost:8080` |
| `MS_SECURITY_INTERNAL_KEY` | (requerida para assign de roles de perfil) |

## Errores

`JwtValidationService` convierte fallos de red o 401 de security en `HttpException` 401 con cuerpo:

```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```
