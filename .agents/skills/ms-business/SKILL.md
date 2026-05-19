---
name: ms-business
description: >-
  Microservicio NestJS de dominio de transporte (rutas, paradas, tickets,
  incidentes, conductores). Patrones controller/service/DTO, TypeORM PostgreSQL,
  validación JWT vía ms-security. Usar al editar ms-business/, crear endpoints,
  migraciones, módulos NestJS o integrar auth/Supabase/incidentes.
paths:
  - ms-business/**
---

# ms-business

**NestJS 11** + **TypeORM** + **PostgreSQL**. Puerto **3000**. Swagger en **`/docs`**.

## Frameworks y dependencias clave

| Componente | Detalle |
|------------|---------|
| NestJS | 11.x — módulos, DI, guards, pipes |
| TypeORM | 0.3.x — entidades, repositorios, migraciones |
| Validación | `class-validator` + `class-transformer` |
| API docs | `@nestjs/swagger` 11 + `swagger-ui-express` |
| HTTP cliente | `@nestjs/axios` → ms-security |
| Runtime | Node 22, **pnpm** |
| Alias | `@/` → `src/` |

## Arquitectura

Regla del proyecto: **controller delgado → service con negocio → DTOs en frontera**.

```
src/<dominio>/
  *.controller.ts    # HTTP + Swagger + guards
  *.service.ts       # reglas + TypeORM
  entities/
  dto/               # base → create → update → response (+ list)
```

Flujo, módulos transversales (`auth/`, `shared/`) y checklist de endpoints nuevos:  
[references/architecture.md](references/architecture.md)  
Guía larga con ejemplos: `ms-business/docs/ARCHITECTURE.md`.

## Estilo de código

- No devolver **entidades TypeORM**; mapear a `response-*.dto.ts`.
- DTOs: `base-*` → `create-*` → `update-*` (`PartialType` desde **`@nestjs/swagger`**) → `response-*`.
- Listas paginadas: `{ items, meta }` con `PaginationQueryDto`.
- JWT: solo vía `JwtValidationService` → ms-security; no firmar tokens aquí.
- `ValidationPipe` global en `main.ts`: whitelist, forbidNonWhitelisted, transform.
- Endpoints sensibles: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` + `@ApiBearerAuth()`.

Patrones DTO: [references/dto-patterns.md](references/dto-patterns.md).

## Swagger (probar la API)

| Recurso | URL |
|---------|-----|
| Swagger UI | `http://localhost:3000/docs` |
| OpenAPI JSON | `http://localhost:3000/docs-json` |

1. `pnpm run start:dev` (PostgreSQL + `.env`)
2. Obtener JWT: login en ms-security (`POST …/login`)
3. En `/docs` → **Authorize** → esquema **bearer** → pegar token
4. Rutas `@Public()` no piden JWT (auto vía `applySwaggerBearerAuth`)

Guía detallada (ejemplos, 401/403, documentar endpoints):  
[references/swagger-testing.md](references/swagger-testing.md).

## Módulos registrados

`AuthModule`, `RouteModule`, `StopModule`, `NodeModule`, `AddressModule`, `CitizenModule`, `TicketModule`, `HistoryModule`, `BusModule`, `SchedulerModule`, `PaymentMethodModule`, `PaymentMethodCitizenModule`, `CardRechargeModule`, `BoardingModule`, `AnalyticsModule`, `EnterpriseModule`, `DriverModule`, `TurnModule`, `IncidentModule`, `DashboardModule`, `SharedModule`.

Catálogo: [references/domains-and-modules.md](references/domains-and-modules.md).

## Crear un endpoint nuevo (workflow)

1. Entidad en `entities/*.entity.ts`.
2. DTOs (base → create → update → response).
3. Lógica en `*.service.ts` (FKs, reglas, mapeo).
4. Rutas en `*.controller.ts` + Swagger.
5. Registrar módulo en `app.module.ts` si es dominio nuevo.
6. Migración TypeORM si cambia esquema (`synchronize: false`).

## Autenticación

- `JwtValidationService` → `POST {MS_SECURITY_URL}/api/public/security/validate-token`.
- Guards: `src/auth/guards/`. Decoradores: `@CurrentUser()`, `@Roles('DRIVER')`, `@Public()`.

Detalle: [references/auth-and-roles.md](references/auth-and-roles.md).

## Incidentes y almacenamiento

- Fotos: Supabase (`SUPABASE_*`, `SUPABASE_INCIDENT_BUCKET`).
- Email: `MS_NOTIFICATION_URL`, `INCIDENT_SUPERVISOR_EMAIL`.

## Verificación local (agentes)

**Rápida** — lint + build (sin tests):

```bash
./.agents/skills/ms-business/scripts/verify.sh
```

**Tests** (cuando haga falta): `pnpm test`  
**CI completo** (GitHub Actions): lint + test + build.

Scripts: `scripts/verify.sh`, `scripts/dev.sh`, `scripts/check-env.sh`. Alias: `test.sh` → `verify.sh`.

```bash
cd ms-business
pnpm install
pnpm run start:dev
pnpm run lint
pnpm run build
```

## Anti-patrones

- Devolver entidades sin mapear a response DTO.
- `synchronize: true` en producción.
- Duplicar lógica JWT (solo ms-security).
- `PartialType` desde `@nestjs/mapped-types` en updates (usar `@nestjs/swagger`).

## Referencias

| Archivo | Contenido |
|---------|-----------|
| [architecture.md](references/architecture.md) | Capas y flujo |
| [swagger-testing.md](references/swagger-testing.md) | Probar `/docs` con JWT |
| [api-catalog.md](references/api-catalog.md) | Rutas HTTP |
| [domains-and-modules.md](references/domains-and-modules.md) | Dominios |
| [auth-and-roles.md](references/auth-and-roles.md) | JWT y guards |
| [dto-patterns.md](references/dto-patterns.md) | DTOs |
| [migrations.md](references/migrations.md) | TypeORM |
| [env-vars.md](references/env-vars.md) | Variables |

Integración monorepo: skill `monorepo-overview`.
