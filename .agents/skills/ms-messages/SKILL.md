---
name: ms-messages
description: >-
  Microservicio NestJS de mensajería (DM, grupos, inbox, alertas masivas,
  Socket.IO). Comparte Postgres con ms-business; JWT vía ms-security.
  Usar al editar ms-messages/, WebSockets, migraciones de chat o alertas.
paths:
  - ms-messages/**
---

# ms-messages

**NestJS 11** + **TypeORM** + **Socket.IO**. Puerto **3001**. Swagger **`/docs`**.

## Requisitos

- Misma `DB_URL` que ms-business (esquema compartido: `persons`, tickets/rutas para alertas).
- `MS_SECURITY_URL` + `MS_SECURITY_INTERNAL_KEY` (sin fallback localhost).
- WS: namespace `/messages`, path `/messages/ws`, una réplica (conexiones en memoria).

## Verificación

```bash
./.agents/skills/ms-messages/scripts/verify.sh
# o: cd ms-messages && pnpm run verify
```

## Referencias rápidas

- README: `ms-messages/README.md`
- Env: `ms-messages/.env.example`
- Realtime: `src/realtime/chat.gateway.ts`
