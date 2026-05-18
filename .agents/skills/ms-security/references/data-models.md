# Modelos de datos — ms-security (MongoDB)

Paquete: `com.jmmg.ms_security.models`

## Core RBAC

### User
- `id`, `name`, `email` (único), `password` (SHA256)
- Referenciado por sesiones, roles, OAuth accounts

### Role
- `name` (ej. ADMIN, DRIVER, USER), `description`

### UserRole
- Relación User ↔ Role (`@DBRef`)
- Índices: unicidad user+role, búsqueda por user/role

### Permission
- Permisos granulares del sistema

### RolePermission
- Relación Role ↔ Permission

### Profile
- Perfiles adicionales asociables a usuarios (endpoints user/profile)

## Sesión y 2FA

### Session
- Sesiones activas del usuario

### AuthFactor
- Factores de segundo factor (`AuthFactorType`, `AuthFactorStatus`)
- Códigos con expiración (`auth.factor.expiration` en properties)

## OAuth

### GitHubAccount / GitHubAuthRequest
- Estados: `GitHubAuthRequestStatus`, modos: `GitHubAuthMode`
- Flujo authorize → callback → complete-registration

### MicrosoftAccount / MicrosoftAuthRequest
- Análogo a GitHub (`MicrosoftAuthRequestStatus`, `MicrosoftAuthMode`)

## Otros

### Method
- Métodos de autenticación registrados

## Relaciones típicas

```
User ──< UserRole >── Role ──< RolePermission >── Permission
User ── Profile (asignación vía API)
User ── GitHubAccount / MicrosoftAccount
```

## DTOs de lectura

`GetUserDetailDTO` — incluye lista de roles para validate-token y detalle de usuario.

No modificar esquema Mongo sin revisar índices en anotaciones `@Indexed` de los modelos.
