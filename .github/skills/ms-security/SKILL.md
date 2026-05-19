---
name: ms-security
description: >-
  Microservicio Spring Boot de autenticación y autorización: JWT, login,
  registro, OAuth Google/GitHub/Microsoft, 2FA, roles y permisos MongoDB.
  Endpoint validate-token para ms-business. Usar al editar ms-security/, auth,
  OAuth, usuarios, roles o integración con ms-notifications.
paths:
  - ms-security/**
---

# ms-security

Spring Boot 4 + Java 17 + Spring Data MongoDB. Puerto **8080**.

## Capas del paquete `com.jmmg.ms_security`

```
controllers/     → REST, validación de entrada, códigos HTTP
services/        → Lógica de negocio (JwtService, SecurityService, OAuth…)
repositories/    → Interfaces MongoDB (IUserRepository, IRoleRepository…)
models/          → Documentos @Document
DTOs/            → Contratos API (records/clases por dominio)
infra/           → config, errors, exceptions
configurations/  → WebConfig, CORS, etc.
```

Detalle de paquetes: [references/layers-and-packages.md](references/layers-and-packages.md).

## Prefijos API

| Prefijo | Acceso | Ejemplos |
|---------|--------|----------|
| `/api/public/security` | Público | login, register, validate-token, OAuth shortcuts |
| `/api/public/security/github` | OAuth GitHub | authorize, callback, link |
| `/api/public/security/microsoft` | OAuth Microsoft | authorize, callback, link |
| `/api/public/users` | Gestión usuarios | CRUD, perfiles |
| `/api/public/user-role` | Asignación roles | user/{id}/role/{id} |
| `/api/roles`, `/api/permissions`, `/api/profiles` | Admin RBAC | CRUD |
| `/api/role-permission` | Permisos por rol | assign-multiple |

Catálogo completo: [references/api-catalog.md](references/api-catalog.md).

## validate-token (integración ms-business)

```
POST /api/public/security/validate-token
Authorization: Bearer <jwt>
```

Respuesta 200: `id`, `name`, `email`, `userId`, `roles[]`.  
Implementación: `ValidationController.java`.

## Configuración de secretos

**No** usar `.env` en el repo para producción. Ruta recomendada:

`~/.config/ms-security/.env` importado vía `spring.config.import` en `application.properties`.

Plantilla: `ms-security/.env.example` y [references/env-vars.md](references/env-vars.md).

## Notificaciones

`notifications.url=${MS_NOTIFICATION_URL}` — ms-security llama al endpoint de email de ms-notifications (forgot password, 2FA, etc.).

## Build y CI

```bash
cd ms-security
./mvnw -B clean verify
```

Script: `scripts/build-verify.sh`, `scripts/check-env.sh`.

## Convenciones

- DTOs en respuestas API; no exponer `models` directamente salvo casos internos.
- Passwords: SHA256 en almacenamiento (ver `docs/ROLES.md`).
- Errores: `infra/errors/ErrorHandle.java`, excepciones en `infra/exception/`.
- Documentación API: springdoc OpenAPI (UI en runtime).

## Referencias

| Archivo | Contenido |
|---------|-----------|
| [api-catalog.md](references/api-catalog.md) | Endpoints |
| [data-models.md](references/data-models.md) | Modelos MongoDB |
| [auth-oauth-2fa.md](references/auth-oauth-2fa.md) | Flujos auth |
| [layers-and-packages.md](references/layers-and-packages.md) | Estructura código |
| [env-vars.md](references/env-vars.md) | Variables |

Docs repo: `docs/ROLES.md`, `docs/GITHUB_LOGIN_FRONTEND.md`.
