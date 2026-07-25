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
- Catálogo fijo (`code`): `CASH`, `SYSTEM_CARD` (recargable), `EXTERNAL_CARD`. Sin QR por ahora.
- Ciudadano elige y vincula con `GET /payment-method` + `POST /payment-method-citizen/me`.

### dashboard
- **HU-ENTR-2-014:** ingresos por método de pago (tickets `completed`, `completedAt` en período).
- **Dashboard operativo:** evolución mensual de incidentes por tipo (`reportedAt`), filtro opcional por empresa.
- **Servicios:** `DashboardPeriodService` (rangos 3/6/12 meses UTC), `DashboardExportService` (CSV), `PaymentMethodIncomeService`, `IncidentTrendByTypeService`.
- **Rutas:** `GET /dashboard/payment-method-income`, `GET /dashboard/payment-method-income/export`, `GET /dashboard/incident-trend-by-type`, `GET /dashboard/incident-trend-by-type/export`.
- **Ticket.amount:** tarifa congelada al crear el ticket desde `route.price`.

### address
- Direcciones asociadas al dominio de ciudadanos/entregas según modelo.

## incident (incident-reports)

- **Entidades:** `Incident`, `IncidentBus`, `IncidentPhoto`, `IncidentComment`, `Gps`.
- **Storage:** `IncidentStorageService` → Supabase.
- **Notificaciones:** `NotificationService` → `MS_NOTIFICATION_URL`.
- **Auth:** conductores (`DRIVER`) en reporte; listado por bus, comentarios y cambio de estado vía JWT (permisos en ms-security).
- **Upload:** hasta 5 imágenes, solo `image/*`, `multipart/form-data`.
- **Listado por bus:** `GET /incident-reports/bus/:busId` — filtros `type`, `status`, estadísticas (`total`, `byType`, `resolutionRate`).
- **Estados:** `reported` (pendiente), `in_review`, `closed` (resuelto).

## shared

- Entidades base (`Person` STI), `HttpExceptionFilter`, `PaginationQueryDto`.
- El vínculo con ms-security es `persons.user_id` = UUID del usuario (sin tabla de mapeo).

## auth

- `JwtValidationService` — cliente HTTP a ms-security.
- Guards en `src/auth/guards/` (usados por incident y extensibles a otros módulos).
- Path alias: `@/*` → `src/*` (`tsconfig.json`).
