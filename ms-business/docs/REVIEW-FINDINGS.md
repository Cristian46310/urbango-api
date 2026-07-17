# ms-business — Hallazgos de revisión (iteraciones 1–6)

Documento generado por la revisión iterativa. Los ítems marcados **Implementado** se aplicaron en remediación.

## Iteración 1 — Auth y perfiles

| Prioridad | Hallazgo | Acción |
|-----------|----------|--------|
| P0 | Auto-asignación DRIVER | **Implementado** |
| P1 | Sync SUPERVISOR | **Implementado** |
| P1 | Perfil antes de assign rol | **Implementado** (outbox + poller) |
| P1 | Aliases ADMIN_BUS / SUPERVISER | **Implementado** |
| P2 | Docs UserIdMapping | **Implementado** |
| P2 | HTTP doble validate+authorize | **Implementado** (cache validate-token 30s) |

## Iteración 2 — BD / TypeORM

| Prioridad | Hallazgo | Acción |
|-----------|----------|--------|
| P1 | Doble FK Bus↔GPS | **Implementado** |
| P1 | notification_subscriptions FKs | **Implementado** (uuid + FK ON DELETE SET NULL) |
| P1 | Índice cola notifiedAt | **Implementado** |
| P1 | Índices FKs operativas | **Implementado** |
| P1 | Route nodos sin transacción | **Implementado** |
| P1 | Alight sin transacción | **Implementado** |
| P1 | Incidente multi-write | **Implementado** (tx + compensación storage) |
| P1 | Boarding race capacidad | **Implementado** |
| P1 | Sandbox recarga sin lock | **Implementado** |
| P2 | UNIQUE(user_id, type) | **Implementado** |
| P2 | Soft delete / CASCADE historial | **Implementado** (ver política abajo) |
| P2 | Eager / N+1 incidentes | **Implementado** (sin eager bus; batch drivers; límite activos) |

## Iteración 3 — Operación

| Prioridad | Hallazgo | Acción |
|-----------|----------|--------|
| P1 | Código stop PAR-n | **Implementado** |
| P1 | CRUD /node evade invariantes | **Implementado** (reglas + min 3 + resecuencia) |
| P1 | Recurrencia scheduler | **Implementado** (materializa 28 días) |
| P1 | Cancel scheduler validaciones | **Implementado** |
| P1 | Foto bus duplicada | **Implementado** (endpoint `/bus/:id/photo` eliminado; usar `/bus-photo`) |
| P1 | Fotos huérfanas Supabase | **Implementado** (delete en replace/remove) |
| P1 | UNIQUE foto por bus | **Implementado** |
| P1 | Fleet cartesian join | **Implementado** (GPS + turns/schedulers en queries separadas) |
| P1 | Nearby sin índice | **Implementado** |
| P1 | Turnos solapados | **Implementado** |
| P2 | ParseUUIDPipe | **Implementado** (route/node/bus/stop/gps/bus-photo) |
| P2 | DELETE 204 | **Implementado** (mismos controladores) |

## Iteraciones 4–5 — Transacciones / dashboard

| Prioridad | Hallazgo | Acción |
|-----------|----------|--------|
| P0 | WebSocket sin JWT | **Implementado** |
| P0 | Retorno ePayco acredita | **Implementado** |
| P1 | Upload sin límite | **Implementado** |
| P1 | Arrival email ajeno | **Implementado** |
| P1 | balance CRUD | **Implementado** |
| P1 | Dashboard N+1 | **Implementado** |
| P1 | Cola alertas sin límite | **Implementado** |
| P1 | Age distribution memoria | **Implementado** (agregación SQL) |
| P2 | SKIP_SIGNATURE prod | **Implementado** |
| P2 | Notifications sin timeout | **Implementado** |

## Iteración 6 — Obs / deps / config / arch

| Prioridad | Hallazgo | Acción |
|-----------|----------|--------|
| P1 | CORS origin:true | **Implementado** |
| P2 | Logging / requestId | **Implementado** |
| P2 | .env.example | **Implementado** |
| P2 | SharedModule muerto | **Implementado** (quitado de AppModule) |
| P2 | Ciclo Bus↔BusPhoto | **Implementado** (sin forwardRef; Bus ya no importa BusPhoto) |
| P3 | axios duplicado / @types/socket.io | **Implementado** (HttpService; quitado `@types/socket.io`) |

## Política de borrado (soft delete)

Soft delete (`deletedAt`) en: **enterprises, buses, routes, stops, schedulers, turns**.

- TypeORM filtra soft-deleted en finds normales.
- Historial operativo (tickets, pagos, recargas, incidentes) **no** se soft-deletea: se conserva como evidencia.
- `notification_subscriptions`: FKs formales a route/bus/stop con `ON DELETE SET NULL` (solo aplica en hard delete).

## Migraciones

- `1782000000000-ReviewSchemaHardening.ts`
- `1782100000000-SoftDeleteAndSubscriptionFks.ts` — soft-delete + FKs de suscripciones
- `1782200000000-ProfileRoleOutbox.ts` — cola de sync de roles CITIZEN/SUPERVISOR

```bash
cd ms-business
npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts
```