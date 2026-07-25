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
User ── GitHubAccount
```

## DTOs de lectura

`GetUserDetailDTO` — `id`, `name`, `email`, `roles`, `permissions` (sin profile; dominio en ms-business `persons`).

No modificar esquema Mongo sin revisar índices en anotaciones `@Indexed` de los modelos.
