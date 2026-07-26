# Modelos de datos — ms-security (JPA / PostgreSQL)

Paquete: `com.jmmg.ms_security.models`  
Schema: `security`

## Core RBAC

### User
- `id` (UUID), `name`, `email` (único), `password` (BCrypt; nullable para OAuth-only)

### Role
- `name` (ej. ADMIN, DRIVER, USER), `description`

### UserRole
- Relación User ↔ Role

### Permission
- Permisos granulares (`url`, `method`, …)

### RolePermission
- Relación Role ↔ Permission

## Sesión y 2FA

### AuthFactor
- Challenge 2FA (`AuthFactorType`, `AuthFactorStatus`)
- Códigos con expiración (`auth.factor.expiration`)
- El JWT es **stateless** (no hay tabla `sessions`).

## OAuth

### GitHubAccount / GitHubAuthRequest
- Estados: `GitHubAuthRequestStatus`, modos: `GitHubAuthMode`
- Flujo authorize → callback → complete-registration

Google login usa idToken (`GoogleTokenVerifierService`) sin tablas dedicadas.

## Otros

### Method
- Métodos HTTP usados en permisos

## Relaciones típicas

```
User ──< UserRole >── Role ──< RolePermission >── Permission
User ── GitHubAccount
```

## DTOs de lectura

`GetUserDetailDTO` — `id`, `name`, `email`, `roles`, `permissions` (perfil de dominio en ms-business `persons`).

Cambios de esquema: scripts en `ms-security/db/` (`V1`…`V10`).
