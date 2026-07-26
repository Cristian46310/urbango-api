# Catálogo API — ms-security

Base local: `http://localhost:8080`

## SecurityController — `/api/public/security`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `login` | Email/password → challenge 2FA |
| POST | `login/google` | Login Google token |
| POST | `login/github/authorize` | Iniciar OAuth GitHub |
| POST | `login/github` | Callback/token GitHub |
| POST | `login/github/complete` | Completar registro GitHub |
| POST | `verify-2fa` | Verificación segundo factor → JWT |
| POST | `register` | Registro usuario |
| POST | `forgot-password` | Solicitud reset |
| POST | `reset-password` | Cambio de contraseña |
| POST | `validate-token` | Valida JWT; usado por ms-business |
| GET | `me` | Usuario autenticado (Bearer) |

## GitHubAuthController — `/api/public/security/github`

| Método | Ruta |
|--------|------|
| GET/POST | `authorize` |
| GET/POST | `link/authorize` |
| GET/POST | `callback` |
| POST | `complete-registration` |
| DELETE | `link` |

## UserController — `/api/users`

| Método | Ruta |
|--------|------|
| GET | `` |
| GET | `/{id}` |
| POST | `` |
| PUT | `{id}` |
| DELETE | `{id}` |

## UserRoleController — `/api/user-role`

| Método | Ruta |
|--------|------|
| POST | `user/{userId}/role/{roleId}` |
| DELETE | `{userRoleId}` |
| POST | `/assign-multiple` |

## RoleController — `/api/roles`

| Método | Ruta |
|--------|------|
| GET | `` |
| GET | `{id}` |
| POST | `` |
| PUT | `{id}` |
| DELETE | `{id}` |

## PermissionController — `/api/permissions`

| Método | Ruta |
|--------|------|
| GET | `` |
| GET | `{id}` |
| POST | `` |
| PUT | `{id}` |
| DELETE | `{id}` |

## RolePermissionController — `/api/role-permission`

| Método | Ruta |
|--------|------|
| POST | `role/{roleId}/permission/{permissionId}` |
| POST | `/assign-multiple` |
| DELETE | `{rolePermissionId}` |

## HealthController — `/api/health`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `` | Health check (Docker / compose) |
