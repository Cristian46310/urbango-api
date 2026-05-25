# Prompt para frontend — HUs ENT-2 (transporte UCaldas)

Usa este documento como instrucción completa para alinear el frontend con el backend actual (`ms-business` + `ms-security`). La base de datos ya incluye la migración `HuEnt2SchemaAlign1779700000000`.

---

## Contexto

| Servicio | URL local | Rol |
|----------|-----------|-----|
| **ms-security** | `http://localhost:8080` | Login, JWT, permisos RBAC por URL |
| **ms-business** | `http://localhost:3000` | Rutas, paraderos, boletos, turnos, incidentes |
| Swagger negocio | `http://localhost:3000/docs` | Contratos y pruebas |
| Swagger auth | `http://localhost:8080/swagger-ui/index.html` | Login |

Todas las peticiones a ms-business (excepto webhooks ePayco) llevan:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

---

## Autenticación (obligatorio antes de operar)

1. Login en ms-security → obtener `token`.
2. **Onboarding de perfil** (una vez):
   - Ciudadano: `POST /citizen` con JWT (`@Authenticated`) → luego `GET /citizen/me`
   - Conductor: `POST /driver` → `GET /driver/me`
3. El JWT trae `id` (MongoDB). El **UUID de negocio** está en `/citizen/me` o `/driver/me` — no confundir con `id` del token.
4. Endpoints con `@Authenticated()` solo validan token (sin permiso por URL en ms-security).
5. El resto pasa por RBAC: ms-business llama a `POST /api/public/security/authorize` con `{ method, url }`. Si falta permiso → **403**.

---

## Modelo mental

```
Route ──nodes (order, estimatedTimeMinutes)── Stop (lat, lon)
Scheduler (bus + route + ventana horaria)
Ticket (citizen, paymentMethodCitizen, scheduler, status, boardedAt, completedAt)
History (ticket, node, eventType: boarding | alighting, createdAt)
Turn (driver, bus, startTime, endTime, actualStartTime, status)
Incident (type, severity, status, GPS) ↔ Bus
```

- **Tarifa:** `route.price` (entero, COP).
- **Tiempo total de ruta:** suma de `nodes[].estimatedTimeMinutes` ordenados por `order`.
- **Estados ticket:** `active` | `completed`.
- **Estados turno:** `scheduled` | `in_progress` | `completed` | `cancelled`.
- **Estados incidente (API):** `reported` (pendiente) | `in_review` | `closed` (resuelto).

---

## HU-ENTR-2-001 — Consulta de rutas

| Acción | API |
|--------|-----|
| Listar | `GET /route?page=1&limit=50&name=Norte` (`name` = filtro parcial, case-insensitive) |
| Detalle + paraderos | `GET /route/:id` |

**Respuesta (`ResponseRouteDto`):**

```json
{
  "id": "uuid",
  "code": "RUT-...",
  "name": "Ruta Norte",
  "description": "...",
  "price": 2500,
  "nodes": [
    {
      "order": 1,
      "estimatedTimeMinutes": 0,
      "stop": { "id", "name", "latitude", "longitude", "location", "type" }
    }
  ],
  "stops": [...],
  "createdAt": "..."
}
```

**UI:** listado con nombre, descripción, tarifa; filtro por `name`; al seleccionar, mapa con marcadores en orden `nodes[].order`; tiempo total = `sum(nodes.estimatedTimeMinutes)`.

---

## HU-ENTR-2-002 — Paraderos cercanos

| Acción | API |
|--------|-----|
| Cercanos | `GET /stop/nearby?lat=5.07&lon=-75.52&limit=5&radiusMeters=1000` |

**Respuesta (`NearbyStopDto[]`):**

```json
[
  {
    "id": "uuid",
    "name": "Paradero Centro",
    "location": "Calle 50",
    "latitude": 5.07,
    "longitude": -75.52,
    "distanceMeters": 183.42,
    "routes": [{ "id": "uuid", "name": "Ruta Norte" }]
  }
]
```

**UI:** `navigator.geolocation` (permiso GPS); top 5 con distancia en m; rutas que pasan; mapa; reconsultar si el usuario se mueve ~100–200 m.

---

## HU-ENTR-2-003 — Abordaje y boleto

**Flujo:**

1. `GET /citizen/me`
2. `GET /card-recharge/cards` → elegir `paymentMethodCitizenId` y mostrar saldo
3. Obtener `busId` (QR/NFC/selección)
4. Obtener `nodeId` del paradero (de `GET /route/:routeId` según programación del bus)
5. `POST /boarding` (JWT `@Authenticated`)

```json
{
  "busId": "uuid",
  "paymentMethodCitizenId": "uuid",
  "nodeId": "uuid"
}
```

**Respuesta 201:**

```json
{
  "success": true,
  "message": "Abordaje exitoso",
  "ticketId": "uuid",
  "remainingBalance": 12500,
  "boardedAt": "2026-05-24T12:00:00.000Z"
}
```

**Errores UX:**

| HTTP | Causa |
|------|--------|
| 400 | Saldo insuficiente, nodo no de la ruta, sin perfil ciudadano |
| 404 | Sin programación activa para ese bus |
| 409 | Bus lleno |

Guardar `ticketId` como boleto activo. **No usar** `POST /ticket` manualmente para el flujo ciudadano.

---

## HU-ENTR-2-004 — Descenso

`POST /ticket/:ticketId/alight` (JWT `@Authenticated`)

```json
{
  "nodeId": "uuid-paradero-actual",
  "busId": "uuid-mismo-bus"
}
```

**Respuesta 200:**

```json
{
  "message": "Viaje completado - Gracias por usar nuestro servicio",
  "ticketId": "uuid",
  "completedAt": "...",
  "stopName": "Paradero X",
  "totalTravelTime": 25
}
```

Solo el dueño del boleto puede descender (**403** si no). Limpiar boleto activo en estado local.

---

## HU-ENTR-2-005 — Recorrido de un viaje

| Acción | API |
|--------|-----|
| Historial | `GET /ticket/me?status=completed&page=1&limit=20` |
| Detalle mapa | **`GET /ticket/:ticketId/trip-details`** (JWT `@Authenticated`, recomendado) |
| Detalle (alternativa) | `GET /history/:historyId/trip-details` (RBAC) |

**Listado (`items[]` en `/ticket/me`):**

- `routeName`, `busPlate`, `totalTravelTimeMinutes`, `boardedAt`, `completedAt`
- `tripDetailHistoryId` — solo si usas el endpoint por `history`; con `ticketId` no hace falta

**Detalle (`ResponseTripDetailsDto`) — mapeo a criterios de aceptación:**

| Criterio HU | Campo API |
|-------------|-----------|
| Mapa con ruta completa | `route.nodes[]` → `stop.latitude`, `stop.longitude`, `order` |
| Paraderos donde validó | `validations[]` donde `type` es `boarding` o `alighting` |
| Hora exacta de cada validación | `validations[].validatedAt` (ISO) |
| Tiempo total de viaje | `totalTime.minutes` y `totalTime.formatted` (ej. `0h25m`) |
| Bus (placa) | `bus.plate` |
| Conductor | `driver.name` (requiere turno del bus solapando `boardedAt`) |

**UI sugerida:** pantalla “Historial de viajes” → lista desde `/ticket/me?status=completed` → al tocar un ítem, `GET /ticket/:id/trip-details` → dibujar polyline con todos los `route.nodes` y pins destacados en nodos presentes en `validations`.

---

## HU-ENTR-2-006 — Inicio de turno (conductor)

1. `GET /driver/me`
2. `POST /turn/start` (JWT `@Authenticated`)

```json
{
  "busStatus": "operativo",
  "observations": "opcional",
  "latitude": 5.069,
  "longitude": -75.517
}
```

`latitude`/`longitude` opcionales: activan/actualizan GPS del bus en backend.

**Respuesta:**

```json
{
  "success": true,
  "message": "Turno iniciado",
  "turnId": "uuid",
  "bus": { "id", "placa", "modelo" },
  "startTime": "hora real de inicio",
  "scheduledStartTime": "hora programada",
  "status": "in_progress"
}
```

**UI:** confirmar estado del bus; mostrar bus asignado; tras iniciar, enviar posición periódica con `POST /gps/bus/:busId` `{ latitude, longitude }` si hay tracking en vivo.

---

## HU-ENTR-2-007 — Reporte de incidente (conductor)

`POST /incident-reports/driver` — `multipart/form-data`, JWT + rol **DRIVER** en permisos.

| Campo | Valor |
|-------|--------|
| `type` | `mechanical` \| `accident` \| `delay` \| `other` |
| `severity` | `low` \| `medium` \| `high` \| `critical` |
| `description` | string |
| `latitude`, `longitude` | number |
| `photos` | hasta 5 imágenes |

Requiere turno `in_progress`. Severidad `high`/`critical` notifica al supervisor por email.

**Labels UI (español):**

| API | UI |
|-----|-----|
| mechanical | Mecánico |
| accident | Accidente |
| delay | Retraso |
| other | Otro |
| low / medium / high / critical | Bajo / Medio / Alto / Crítico |

---

## HU-ENTR-2-008 — Incidentes por bus (admin empresa)

| Acción | API |
|--------|-----|
| Listado + stats | `GET /incident-reports/bus/:busId?type=mechanical&status=reported&page=1&limit=20` |
| Comentarios | `GET /incident-reports/:incidentId/comments` |
| Agregar | `POST /incident-reports/:incidentId/comments` `{ "text": "..." }` |
| Estado | `PUT /incident-reports/:incidentId/status` `{ "status": "in_review" }` |

`statistics`: `{ total, byType, resolutionRate }`.

---

## Cliente HTTP (referencia TypeScript)

```typescript
const API_BUSINESS = import.meta.env.VITE_MS_BUSINESS_URL ?? 'http://localhost:3000';
const API_SECURITY = import.meta.env.VITE_MS_SECURITY_URL ?? 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('jwt');
}

async function businessApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BUSINESS}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw err;
  }
  return res.json();
}

// Ejemplos
export const listRoutes = (name?: string) =>
  businessApi<{ items: RouteDto[]; meta: PaginationMeta }>(
    `/route?limit=50${name ? `&name=${encodeURIComponent(name)}` : ''}`,
  );

export const nearbyStops = (lat: number, lon: number) =>
  businessApi<NearbyStopDto[]>(`/stop/nearby?lat=${lat}&lon=${lon}&limit=5`);

export const board = (body: BoardingRequest) =>
  businessApi<BoardingResponse>('/boarding', { method: 'POST', body: JSON.stringify(body) });

export const myTickets = (status?: 'active' | 'completed') =>
  businessApi<{ items: TicketDto[]; meta: PaginationMeta }>(
    `/ticket/me${status ? `?status=${status}` : ''}`,
  );

export const alight = (ticketId: string, body: AlightRequest) =>
  businessApi<AlightResponse>(`/ticket/${ticketId}/alight`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const tripDetails = (ticketId: string) =>
  businessApi<TripDetailsDto>(`/ticket/${ticketId}/trip-details`);

export const startTurn = (body: StartTurnRequest) =>
  businessApi<StartTurnResponse>('/turn/start', { method: 'POST', body: JSON.stringify(body) });
```

---

## Checklist de pantallas

- [ ] Login + persistencia JWT
- [ ] Registro ciudadano/conductor si no existe perfil
- [ ] **Planificación:** listado rutas + filtro + detalle mapa (HU-001)
- [ ] **Planificación:** paraderos cercanos + mapa (HU-002)
- [ ] **Boletos:** abordaje → confirmación + saldo (HU-003)
- [ ] **Boletos:** descenso boleto activo (HU-004)
- [ ] **Historial:** `/ticket/me?status=completed` + `/ticket/:id/trip-details` + mapa (HU-005)
- [ ] **Conductor:** inicio turno + GPS (HU-006)
- [ ] **Conductor:** formulario incidente multipart (HU-007)
- [ ] **Admin:** incidentes por bus, filtros, comentarios, estado (HU-008)
- [ ] Manejo 401/403/409 con mensajes del backend
- [ ] Permisos RBAC registrados en ms-security para rutas usadas

---

## Permisos sugeridos en ms-security (roles)

Registrar en MongoDB permisos por método + URL (o patrones `/*`):

| Rol | Rutas mínimas |
|-----|----------------|
| **CITIZEN** | `GET /route`, `GET /route/*`, `GET /stop/nearby`, `POST /boarding`, `POST /ticket/*/alight`, `GET /ticket/me`, `GET /history/*/trip-details`, `GET /card-recharge/*`, `POST /payment-method-citizen/me` |
| **DRIVER** | Lo anterior de conductor: `POST /turn/start`, `POST /gps/bus/*`, `POST /incident-reports/driver` |
| **BUSINESS_ADMIN** / **ADMIN** | `GET /incident-reports/bus/*`, `GET /incident-reports/*/comments`, `POST /incident-reports/*/comments`, `PUT /incident-reports/*/status` |

Endpoints `@Authenticated()` (`/citizen/me`, `/boarding`, `/turn/start`, `/ticket/me`, `/ticket/:id/alight`) no requieren entrada en RBAC si solo usan validación de token.

---

## Verificación local

```bash
# ms-security :8080, ms-business :3000
cd ms-business && pnpm run start:dev
# Swagger: http://localhost:3000/docs
```

Probar flujo: login → `GET /citizen/me` → `GET /route` → `POST /boarding` (con datos semilla de ruta/bus/scheduler).
