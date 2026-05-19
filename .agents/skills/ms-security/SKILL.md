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

**Spring Boot 4** + **Java 17** + **Spring Data MongoDB**. Puerto **8080**.

## Frameworks y dependencias clave

| Componente | Detalle |
|------------|---------|
| Spring Boot | 4.0.x (`spring-boot-starter-parent`) |
| Persistencia | MongoDB (`@Document`, repositories) |
| API docs | springdoc-openapi 3 → Swagger UI |
| Build | Maven Wrapper (`./mvnw`) |
| Utilidades | Lombok |
| Tests (CI) | `spring-boot-starter-*-test`, `mvn verify` |

## Arquitectura

Capas en `com.jmmg.ms_security`:

```
controllers/ → services/ → repositories/ → models/ (MongoDB)
     ↓              ↓
   DTOs/      infra/ (config, errors, springdoc)
```

- **Controller:** REST, `@Valid`, `ResponseEntity`, sin lógica de negocio pesada.
- **Service:** JWT, login, OAuth, RBAC, llamadas a ms-notifications.
- **Repository:** interfaces Spring Data.
- **DTOs:** contrato API; no exponer `models/` en JSON.

Diagrama y convenciones: [references/architecture.md](references/architecture.md).  
Paquetes y servicios: [references/layers-and-packages.md](references/layers-and-packages.md).

## Estilo de código

- Respuestas siempre como **DTO**; modelos Mongo solo internos.
- Rutas públicas bajo `/api/public/`; admin RBAC en `/api/roles`, `/api/permissions`, etc.
- Errores centralizados: `infra/errors/ErrorHandle.java`.
- Passwords: **SHA256** (`docs/ROLES.md`).
- Secretos: `~/.config/ms-security/.env` (no en el repo).

## Swagger (probar la API)

| Recurso | URL |
|---------|-----|
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI | `http://localhost:8080/v3/api-docs` |

Esquema JWT: **`bearer-jwt`** (`SpringDocConfiguration.java`).

1. Arrancar: `./mvnw spring-boot:run`
2. `POST /api/public/security/login` → copiar `token`
3. **Authorize** en Swagger → pegar JWT
4. Probar endpoints protegidos

Guía paso a paso: [references/swagger-testing.md](references/swagger-testing.md).

## Prefijos API

| Prefijo | Acceso | Ejemplos |
|---------|--------|----------|
| `/api/public/security` | Público | login, register, validate-token, OAuth |
| `/api/public/users` | Usuarios | CRUD, perfiles |
| `/api/roles`, `/api/permissions` | Admin RBAC | CRUD |

Catálogo: [references/api-catalog.md](references/api-catalog.md).

## validate-token (ms-business)

```
POST /api/public/security/validate-token
Authorization: Bearer <jwt>
```

Respuesta 200: `id`, `name`, `email`, `userId`, `roles[]`.  
Implementación: `ValidationController.java`.

## Notificaciones

`notifications.url=${MS_NOTIFICATION_URL}` — forgot password, 2FA, etc.  
URL completa del send de ms-notifications.

## Verificación local (agentes)

**Rápida** — solo compilar:

```bash
./.agents/skills/ms-security/scripts/build.sh
```

**CI completo** (GitHub Actions): `./mvnw -B clean verify` (tests con `src/test/resources/application.properties`).

Scripts: `scripts/build.sh`, `scripts/check-env.sh`. Alias: `build-verify.sh` → `build.sh`.

## Referencias

| Archivo | Contenido |
|---------|-----------|
| [architecture.md](references/architecture.md) | Capas y convenciones |
| [swagger-testing.md](references/swagger-testing.md) | Probar con Swagger UI |
| [api-catalog.md](references/api-catalog.md) | Endpoints |
| [data-models.md](references/data-models.md) | MongoDB |
| [auth-oauth-2fa.md](references/auth-oauth-2fa.md) | Flujos auth |
| [layers-and-packages.md](references/layers-and-packages.md) | Estructura detallada |
| [env-vars.md](references/env-vars.md) | Variables |

Docs repo: `docs/ROLES.md`, `docs/GITHUB_LOGIN_FRONTEND.md`.
