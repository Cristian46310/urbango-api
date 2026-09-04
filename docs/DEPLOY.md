# Despliegue

> **Nota:** La contenedorización con Docker aún no está implementada. Este documento describe el despliegue manual actual y lo planificado.

## Estado actual

Cada microservicio se ejecuta de forma independiente en el host (JVM, Node/pnpm o Python/uv). Ver el [README](../README.md) para arranque local y variables de entorno por servicio.

## Requisitos de infraestructura

- PostgreSQL accesible (Supabase u otro): schema `security` para ms-security y schema `public` compartido por ms-business/ms-messages.
- Puerto expuesto por servicio según necesidad del frontend:
  - ms-security: `8080`
  - ms-business: `3000`
  - ms-messages: `3001`
  - ms-notifications: `8000`
  - ms-ai: `8001`
- Secretos fuera del repositorio: `.env`, `secrets/`, claves JWT, OAuth Gmail.

## Variables críticas entre servicios

| Variable | Servicio | Descripción |
|----------|----------|-------------|
| `MS_SECURITY_URL` | business, messages, ai | URL base de ms-security |
| `MS_SECURITY_INTERNAL_KEY` | business, messages | Header `X-Internal-Key` para APIs internas |
| `MS_NOTIFICATION_URL` | security, business, ai | Endpoint completo de envío de email |
| `DB_URL` | todos los que usan Postgres | Cadena de conexión JDBC o PostgreSQL |

Ver variables por servicio en el [README](../README.md) y cada `README.md` de microservicio.

## Checklist antes de producción

1. Configurar CORS (`CORS_ALLOWED_ORIGINS`) en cada servicio con el dominio del frontend.
2. Usar `JWT_SECRET` de al menos 32 caracteres y rotarlo periódicamente.
3. Ejecutar migraciones TypeORM en ms-business y ms-messages antes del arranque.
4. Verificar health endpoints tras el despliegue.
5. No commitear `.env` ni archivos `client_secret_*.json`.

## Planificado (Docker)

Cuando se implemente la contenedorización:

- `docker-compose.yml` en la raíz del monorepo.
- Dockerfiles por microservicio.
- Montaje de volúmenes para secretos de Gmail (`ms-notifications/secrets/`).
- Healthchecks y red interna entre servicios.

Hasta entonces, usar el desarrollo local descrito en el [README](../README.md).
