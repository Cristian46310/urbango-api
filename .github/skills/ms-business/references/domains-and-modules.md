# Dominios y módulos — ms-business

## Transporte y red

### route
- **Entidad:** `Route` — name, description, price, relación `nodes`.
- **Reglas:** al crear con nodos, validar `stopId` existentes; `order` único por ruta; respuesta con stops ordenados.
- **Archivos clave:** `route.service.ts`, `create-route-nodes.dto.ts`.

### stop
- **Entidad:** `Stop` — name, location.
- **Extra:** `GET /stop/nearby` — búsqueda por proximidad (`nearby-stop.dto.ts`).
- **Regla:** no eliminar si tiene nodos asociados.

### node
- **Entidad:** `Node` — une `Route` + `Stop` con `order`.
- **Creación:** `POST /node/route/:routeId/stop/:stopId` — valida existencia de ruta y parada.

## Personas y operación

### citizen / driver
- Extienden patrón persona (`shared/entities/person.entitie.ts`, `base-person.dto.ts`).
- CRUD estándar.

### enterprise
- Empresa operadora; puede incluir `supervisorEmail` para notificaciones de incidentes críticos.

### turn
- Turnos de conductor; vinculados a operación de buses.

### bus / scheduler
- Flota y programación de servicios.

## Transacciones

### ticket
- Venta/uso de tiquetes; `POST /ticket/:id/alight` — bajada del pasajero (`alight-ticket.dto.ts`).

### history
- Historial de viajes; `GET /history/:id/trip-details` — detalle extendido.

### payment-method / payment-method-citizen
- Métodos de pago y asociación ciudadano–método.

### address
- Direcciones asociadas al dominio de ciudadanos/entregas según modelo.

## incident (incident-reports)

- **Entidades:** `Incident`, `IncidentBus`, `IncidentPhoto`, `Gps`.
- **Storage:** `IncidentStorageService` → Supabase.
- **Notificaciones:** `NotificationService` → `MS_NOTIFICATION_URL`.
- **Auth:** solo conductores (`DRIVER`); `currentUser.id` es ObjectId de ms-security.
- **Upload:** hasta 5 imágenes, solo `image/*`, `multipart/form-data`.

## shared

- `UserIdMapping` — Mongo ObjectId ↔ PostgreSQL UUID.
- `HttpExceptionFilter` — respuestas de error consistentes.
- `PaginationQueryDto` — listados paginados.

## auth

- `JwtValidationService` — cliente HTTP a ms-security.
- Guards en `src/auth/guards/` (usados por incident y extensibles a otros módulos).
- Path alias: `@/*` → `src/*` (`tsconfig.json`).
