# Contexto IA y CI — dev-backend-uc

Guía para agentes y revisores de PR en el monorepo UCaldas.

## Mapa rápido

| Si el diff toca… | Skill | Verificación local (rápida) |
|------------------|-------|----------------------------|
| `ms-business/**` | `ms-business` | `.agents/skills/ms-business/scripts/verify.sh` (lint + build) |
| `ms-security/**` | `ms-security` | `.agents/skills/ms-security/scripts/build.sh` (solo compile) |
| `ms-notifications/**` | `ms-notifications` | `.agents/skills/ms-notifications/scripts/lint.sh` |
| `docker-compose.yml`, `docs/`, integraciones | `monorepo-overview` | — |

Índice completo: [AGENTS.md](../AGENTS.md).

## Workflows GitHub Actions (CI completo)

| Workflow | Directorio | Comandos CI |
|----------|------------|-------------|
| `ms-security.yml` | `ms-security` | `mvn -B clean verify`, `mvn checkstyle:check` |
| `ms-notifications.yml` | `ms-notifications` | `uv sync --locked --group dev`, ruff check/format |
| `ms-business.yml` | `ms-business` | `pnpm install`, lint, **test**, build |

Ramas: `main`, `dev` (push y pull_request).

Los scripts en `.agents/skills/*/scripts/` omiten tests/checkstyle a propósito para iteración rápida; antes de merge conviene que el CI del MS esté en verde.

## Contratos que no romper sin aviso

1. `POST /api/public/security/validate-token` — consumido por ms-business.
2. `POST /api/email/send` body `{ to, subject, body, files? }` — consumido por ms-security y ms-business.
3. Nombres de roles (`DRIVER`, etc.) coherentes entre MongoDB y `@Roles()` en Nest.

Detalle: `.agents/skills/monorepo-overview/references/inter-service-contracts.md`.

## Hooks java-upgrade

`.github/java-upgrade/hooks/scripts/recordToolUse.sh` registra uso de herramientas en sesiones de upgrade Java (extensión). No afecta el build de los microservicios; ignorar salvo trabajo explícito de migración Java.

## Checklist PR

- [ ] Skill/reference actualizada si cambia API pública o env vars obligatorias
- [ ] Sin secretos en el diff (`.env`, `secrets/`, JWT keys)
- [ ] CI del microservicio afectado en verde
- [ ] Migraciones TypeORM incluidas si cambia esquema PostgreSQL (ms-business)
