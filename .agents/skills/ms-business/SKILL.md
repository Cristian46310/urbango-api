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

NestJS 11 + TypeORM + PostgreSQL. Puerto por defecto **3000**. Swagger en `/docs`.

## Arquitectura por dominio

Regla del proyecto (detalle en `ms-business/docs/ARCHITECTURE.md`):

1. **Controller** — solo HTTP: parámetros, body, delegación al service.
2. **Service** — reglas de negocio, repositorios, transformación a DTO de respuesta.
3. **DTO** — entrada (`create-*`, `update-*`, `base-*`) y salida (`response-*`, listas con `items` + `meta`).
4. **Entity** — TypeORM; no exponer directamente en la API.

## Módulos registrados

`AuthModule`, `RouteModule`, `StopModule`, `NodeModule`, `AddressModule`, `CitizenModule`, `TicketModule`, `HistoryModule`, `BusModule`, `SchedulerModule`, `PaymentMethodModule`, `PaymentMethodCitizenModule`, `CardRechargeModule`, `EnterpriseModule`, `DriverModule`, `TurnModule`, `IncidentModule`, `SharedModule`.

Catálogo por dominio: [references/domains-and-modules.md](references/domains-and-modules.md).

## Crear un endpoint nuevo (workflow)

1. Entidad en `entities/*.entity.ts` (relaciones TypeORM).
2. `base-*.dto.ts` → `create-*.dto.ts` → `update-*.dto.ts` (`PartialType`).
3. `response-*.dto.ts` y `response-*-list.dto.ts` si aplica paginación.
4. Métodos en `*.service.ts` (validar FKs, reglas, mapear respuesta).
5. Rutas en `*.controller.ts` + decoradores Swagger (`@ApiTags`, `@ApiOperation`).
6. Registrar módulo en `app.module.ts` si es dominio nuevo.
7. Migración TypeORM si cambia el esquema (`synchronize: false`).

Patrones DTO: [references/dto-patterns.md](references/dto-patterns.md).

## Autenticación

- No validar JWT localmente: usar `JwtValidationService` → `POST {MS_SECURITY_URL}/api/public/security/validate-token`.
- Guards esperados en `src/auth/guards/` (`jwt.guard.ts`, `roles.guard.ts`).
- Decoradores: `@CurrentUser()`, `@Roles('DRIVER')`, `@UseGuards(JwtAuthGuard, RolesGuard)`.
- Ejemplo protegido: `POST /incident-reports/driver` requiere rol `DRIVER`.

Detalle: [references/auth-and-roles.md](references/auth-and-roles.md).

## Migraciones

- Config: `typeorm.config.ts`, entidades auto-cargadas desde `**/entities/*.ts`.
- Carpeta: `src/migrations/`.
- Generar/ejecutar con CLI TypeORM apuntando a `AppDataSource` (ver [references/migrations.md](references/migrations.md)).

## Incidentes y almacenamiento

- Fotos: Supabase Storage (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_INCIDENT_BUCKET`).
- Email supervisor: `MS_NOTIFICATION_URL`, `INCIDENT_SUPERVISOR_EMAIL` o `supervisorEmail` en enterprise.

## Comandos

```bash
cd ms-business
pnpm install
pnpm run start:dev      # desarrollo
pnpm run lint
pnpm test
pnpm run build
```

Scripts: `scripts/dev.sh`, `scripts/test.sh`, `scripts/check-env.sh`.

## Anti-patrones

- Devolver entidades TypeORM sin mapear a response DTO.
- Activar `synchronize: true` en producción.
- Duplicar lógica de firma/parseo JWT (solo ms-security).
- Omitir `ValidationPipe` global (ya configurado en `main.ts`: whitelist, transform).

## Referencias

| Archivo | Contenido |
|---------|-----------|
| [api-catalog.md](references/api-catalog.md) | Rutas HTTP |
| [domains-and-modules.md](references/domains-and-modules.md) | Entidades y reglas |
| [auth-and-roles.md](references/auth-and-roles.md) | JWT y guards |
| [dto-patterns.md](references/dto-patterns.md) | Convenciones DTO |
| [migrations.md](references/migrations.md) | TypeORM migrations |
| [env-vars.md](references/env-vars.md) | Variables de entorno |

Integración monorepo: skill `monorepo-overview`.
