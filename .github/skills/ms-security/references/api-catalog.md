# Catálogo API — ms-security

Base local: `http://localhost:8080`

## SecurityController — `/api/public/security`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `login` | Email/password → JWT |
| POST | `login/google` | Login Google token |
| POST | `login/github/authorize` | Iniciar OAuth GitHub |
| POST | `login/github` | Callback/token GitHub |
| POST | `login/github/complete` | Completar registro GitHub |
| POST | `login/microsoft/authorize` | Iniciar OAuth Microsoft |
| POST | `login/microsoft` | Token Microsoft |
| POST | `login/microsoft/complete` | Completar registro Microsoft |
| POST | `verify-2fa` | Verificación segundo factor |
| POST | `register` | Registro usuario |
| POST | `forgot-password` | Solicitud reset |
| POST | `reset-password` | Cambio de contraseña |
| GET | `me` | Usuario autenticado (Bearer) |

## ValidationController — `/api/public/security`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `validate-token` | Valida JWT; usado por ms-business |

## GitHubAuthController — `/api/public/security/github`

| Método | Ruta |
|--------|------|
| GET/POST | `authorize` |
| GET/POST | `link/authorize` |
| GET/POST | `callback` |
| POST | `complete-registration` |
| DELETE | `link` |

## MicrosoftAuthController — `/api/public/security/microsoft`

| Método | Ruta |
|--------|------|
| GET/POST | `authorize` |
| GET/POST | `link/authorize` |
| GET/POST | `callback` |
| POST | `complete-registration` |
| DELETE | `link` |

## UserController — `/api/public/users`

| Método | Ruta |
|--------|------|
| GET | `` |
| GET | `/{id}` |
| POST | `` |
| PUT | `{id}` |
| DELETE | `{id}` |
| POST | `{id}/profile/{profileID}` |
| DELETE | `{id}/profile/{profileID}` |

## UserRoleController — `/api/public/user-role`

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

## ProfileController — `/api/profiles`

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

## Actuator

Health (Docker): `GET /actuator/health`
