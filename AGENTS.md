# dev-backend-uc — Guía para agentes de IA

Backend del proyecto UCaldas (semestre 2026-1). Monorepo con microservicios independientes que se integran por HTTP (ms-messages comparte Postgres con ms-business).

## Microservicios

| Servicio | Stack | Puerto | Carpeta | Skill |
|----------|-------|--------|---------|-------|
| **ms-security** | Spring Boot 4, Java 17, PostgreSQL (Supabase schema `security`) | 8080 | `ms-security/` | `/ms-security` o skill `ms-security` |
| **ms-business** | NestJS 11, TypeORM, PostgreSQL | 3000 | `ms-business/` | `/ms-business` o skill `ms-business` |
| **ms-messages** | NestJS 11, TypeORM, Socket.IO, PostgreSQL (misma BD que business) | 3001 | `ms-messages/` | `/ms-messages` o skill `ms-messages` |
| **ms-notifications** | FastAPI, Python 3.12, uv, Gmail API | 8000 | `ms-notifications/` | `/ms-notifications` o skill `ms-notifications` |

Skill transversal del monorepo: `/monorepo-overview` o `.agents/skills/monorepo-overview/`.

## Orden de lectura recomendado

1. Trabajas en varios MS o integraciones → lee `monorepo-overview` y `references/inter-service-contracts.md`.
2. Entras a un MS concreto → abre su `SKILL.md` en `.agents/skills/<nombre>/`.
3. Necesitas detalle de API, modelos o env → `references/` dentro de esa skill.
4. Auth/OAuth global → `docs/ROLES.md`, `docs/GITHUB_LOGIN_FRONTEND.md`.
5. Despliegue → `docs/DEPLOY.md`, `docker-compose.yml`.

## Ubicación de skills y reglas

```
.agents/skills/          # Agent Skills (Cursor las descubre automáticamente)
.cursor/rules/           # Reglas cortas por glob al editar archivos
.github/AI_CONTEXT.md    # Contexto para PRs y CI
```

## Flujo de autenticación (resumen)

1. El frontend hace login en **ms-security** → recibe JWT.
2. **ms-business** recibe `Authorization: Bearer <token>` y valida contra `POST /api/public/security/validate-token`.
3. Los IDs de usuario en ms-security son UUID (string en JWT); en ms-business se guardan en `persons.user_id`.

## Reglas globales

- No commitear `.env`, `secrets/`, claves JWT ni `client_secret_*.json`.
- **ms-security:** secretos en `~/.config/ms-security/.env` (ver `ms-security/README.md`).
- **ms-business:** `synchronize: false` en TypeORM; usar migraciones en `src/migrations/`.
- Documentación de dominio en español; identificadores de código en inglés.
- Antes de cambiar contratos HTTP entre MS, actualizar `monorepo-overview/references/inter-service-contracts.md`.

## Verificación local (rápida) vs CI

Scripts para agentes y desarrollo ágil. GitHub Actions ejecuta pasos adicionales (tests Java en ms-security, jest en Nest).

| MS | Script | Comando equivalente |
|----|--------|---------------------|
| ms-security | `scripts/build.sh` | `mvn clean package -DskipTests` |
| ms-business | `scripts/verify.sh` | `pnpm lint` + `pnpm build` |
| ms-messages | `scripts/verify.sh` | `pnpm lint` + `pnpm build` |
| ms-notifications | `scripts/lint.sh` | `ruff check` + `ruff format --check` |

## Comandos rápidos (desde la raíz del repo)

```bash
# Verificación rápida por microservicio
./.agents/skills/ms-security/scripts/build.sh
./.agents/skills/ms-business/scripts/verify.sh
./.agents/skills/ms-messages/scripts/verify.sh
./.agents/skills/ms-notifications/scripts/lint.sh

# Docker (security + notifications + messages)
docker compose up -d --build ms-security ms-notifications ms-messages
```

Swagger local: ms-security `:8080/swagger-ui/index.html`, ms-business `:3000/docs`, ms-messages `:3001/docs`, ms-notifications `:8000/docs`.

## Documentación humana existente

- [ms-business/docs/ARCHITECTURE.md](ms-business/docs/ARCHITECTURE.md)
- [docs/ROLES.md](docs/ROLES.md)
- [docs/DEPLOY.md](docs/DEPLOY.md)
- [ms-notifications/README.md](ms-notifications/README.md)
