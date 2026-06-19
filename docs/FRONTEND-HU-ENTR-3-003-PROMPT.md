# Prompt para frontend — HU-ENTR-3-003 (Notificación de bus próximo)

Usa este documento como instrucción completa para implementar en el frontend la historia **HU-ENTR-3-003** contra el backend actual (`ms-business` + `ms-security`). El backend ya expone REST + WebSocket; **falta toda la UI ciudadano**.

---

## Historia de usuario

**Como** ciudadano esperando en paradero  
**Quiero** recibir notificación cuando mi bus esté cerca  
**Para** no perder el viaje y optimizar mi tiempo de espera  

### Criterios de aceptación (mapear 1:1 en UI)

1. El ciudadano puede **activar notificación** para una **ruta específica** en un **paradero**.
2. Se solicita **cuántos minutos de anticipación** desea: **5, 10 o 15** minutos.
3. Cuando el bus está dentro de la ventana configurada, se envía **notificación** (hoy: **WebSocket in-app** + **email**; no hay FCM/APNs).
4. La notificación indica: **nombre de ruta**, **tiempo estimado de llegada**, **placa del bus**.
5. Se puede ver **ubicación en tiempo real** del bus desde la notificación.
6. La notificación tiene **acción rápida** para preparar método de pago.

---

## Contexto técnico

| Servicio | URL local | Rol |
|----------|-----------|-----|
| **ms-security** | `http://localhost:8080` | Login, JWT |
| **ms-business** | `http://localhost:3000` | REST + WebSocket tiempo real |
| Swagger negocio | `http://localhost:3000/docs` | Contratos |
| ms-notifications | `http://localhost:8000` | Email (backend lo llama; el front no) |

Variable sugerida en el front:

```env
VITE_MS_BUSINESS_URL=http://localhost:3000
VITE_MS_SECURITY_URL=http://localhost:8080
```

Todas las peticiones REST a ms-business llevan:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Rol requerido:** `CITIZEN` (o supervisor/admin).

---

## Dependencias del front

```bash
npm install socket.io-client
```

---

## Flujo de pantalla (obligatorio)

### Entrada: pantalla “Esperando en paradero”

Puede integrarse en:
- Vista de **paraderos cercanos** (HU-ENTR-2-002 → `GET /stop/nearby`)
- Vista de **detalle de ruta** (HU-ENTR-2-001 → `GET /route/:id`)

El ciudadano debe poder elegir:
- **Paradero** (`stopId`)
- **Ruta** (`routeId`) — una de las que pasan por ese paradero
- **Anticipación:** radio/select con valores **5 | 10 | 15** (default **10**)

Botón primario: **“Avísame cuando llegue el bus”**.

### Antes de activar (recomendado)

Consultar diagnóstico opcional:

```http
GET /dashboard/realtime/fleet?routeId={routeId}&stopId={stopId}
```

Si `items` está vacío → mostrar aviso: *“No hay buses en servicio en esta ruta ahora”* y deshabilitar el botón o permitir programar igual (`scheduled: true`).

Mostrar ETA previo si existe: `items[0].estimatedMinutesToWaitingStop`.

### Al activar

**Orden estricto:**

1. Conectar WebSocket y suscribirse al email del usuario **antes** del POST.
2. Llamar `POST /dashboard/realtime/arrival-notification`.
3. Mostrar feedback según respuesta (ver abajo).
4. Escuchar evento WS para la alerta in-app.

### Al recibir alerta

Mostrar **banner / toast / modal persistente** con:
- Ruta: `{routeName}`
- Placa: `{plate}`
- ETA: `{etaMinutes}` min
- Paradero: `{stopName}`

Acciones:
- **Ver bus en mapa** → navegar a pantalla de tracking (ver sección Mapa).
- **Preparar pago** → navegar a flujo de métodos de pago (`/payment-method-citizen` o pantalla existente de tarjeta).

Opcional: `Notification.requestPermission()` del navegador para notificación nativa del SO (no es push móvil FCM).

---

## API REST

### Activar suscripción

```http
POST /dashboard/realtime/arrival-notification
Authorization: Bearer <JWT>
```

**Body (`CreateArrivalNotificationDto`):**

```json
{
  "routeId": "uuid-ruta",
  "stopId": "uuid-paradero",
  "anticipationMinutes": 10,
  "message": "Opcional"
}
```

- `email` es opcional; si se omite, el backend usa el email del JWT.
- `busId` es opcional; si se omite, el backend elige el bus de la ruta con **menor ETA** al paradero.
- `anticipationMinutes` solo acepta **5, 10 o 15**; otro valor → **400**.

**Respuesta:**

```json
{
  "subscribed": true,
  "sent": false,
  "scheduled": true,
  "etaMinutes": 8,
  "stopName": "Paradero B"
}
```

| Campo | Significado | UI |
|-------|-------------|-----|
| `subscribed` | Suscripción creada | Toast éxito |
| `sent` | Email ya enviado (ETA ya en ventana) | Alerta inmediata + “Revisa tu correo” |
| `scheduled` | Quedó pendiente; el backend reintenta cada ~15 s | “Te avisaremos cuando esté cerca” |
| `etaMinutes` | ETA actual al paradero | Texto informativo |
| `stopName` | Nombre del paradero | Texto informativo |

### Seguimiento en mapa (REST)

```http
GET /dashboard/realtime/bus/{busId}?stopId={stopId}
Authorization: Bearer <JWT>
```

**Respuesta (`ResponseRealtimeBusDto`):** usar `lat`, `lng`, `plate`, `routeName`, `estimatedMinutesToWaitingStop`, `statusColor`, `occupancyPercent`.

Para actualización continua en mapa, suscribirse también al WS del bus:

```javascript
socket.emit('dashboard:subscribe-bus', { busId, stopId });
socket.on('dashboard:realtime:bus', (bus) => { /* mover marcador */ });
```

### Flota (opcional, pantalla de espera)

```http
GET /dashboard/realtime/fleet?routeId={routeId}&stopId={stopId}
```

---

## WebSocket (alerta in-app)

| Parámetro | Valor |
|-----------|-------|
| URL | `{MS_BUSINESS}/dashboard/realtime` |
| Path engine | `/dashboard/realtime/ws` |
| Transporte | `websocket` |

### Conexión y suscripción

```javascript
import { io } from 'socket.io-client';

const socket = io(`${API}/dashboard/realtime`, {
  path: '/dashboard/realtime/ws',
  transports: ['websocket'],
});

socket.on('connect', () => {
  socket.emit('dashboard:subscribe-notifications', {
    email: user.email, // mismo email del JWT
  });
});
```

Ack del servidor: `{ subscribed: true, room: "notification:email@..." }`.

### Evento de alerta

```javascript
socket.on('dashboard:realtime:arrival-notification', (payload) => {
  // payload completo ↓
});
```

**Payload:**

```json
{
  "email": "ciudadano@example.com",
  "busId": "uuid-bus",
  "routeName": "Ruta Norte",
  "plate": "ABC-123",
  "etaMinutes": 5,
  "stopName": "Paradero Centro",
  "trackingPath": "/dashboard/realtime/bus/uuid-bus",
  "paymentActionPath": "/payment-method-citizen",
  "status": {
    "busId": "uuid-bus",
    "plate": "ABC-123",
    "lat": 5.073,
    "lng": -75.525,
    "routeName": "Ruta Norte",
    "estimatedMinutesToWaitingStop": 5,
    "statusColor": "green",
    "occupancyPercent": 40
  }
}
```

**Importante para el front:**
- El gateway emite este evento en ciclos de **~15 segundos** para suscripciones pendientes.
- Si el POST responde `sent: true` de inmediato, el **email** sale al instante pero el **WS puede tardar** o no llegar en el mismo request. Mantener la suscripción WS abierta.
- Usar `status.lat` / `status.lng` para el mapa inicial; `trackingPath` es ruta relativa de API (prefijar con base URL o navegar a pantalla interna `/tracking/:busId`).

---

## Código de referencia (TypeScript)

```typescript
const API = import.meta.env.VITE_MS_BUSINESS_URL ?? 'http://localhost:3000';

export async function activateArrivalAlert(
  token: string,
  routeId: string,
  stopId: string,
  anticipationMinutes: 5 | 10 | 15,
) {
  const res = await fetch(`${API}/dashboard/realtime/arrival-notification`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ routeId, stopId, anticipationMinutes }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function connectArrivalNotifications(
  email: string,
  onAlert: (payload: ArrivalNotificationPayload) => void,
) {
  const socket = io(`${API}/dashboard/realtime`, {
    path: '/dashboard/realtime/ws',
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    socket.emit('dashboard:subscribe-notifications', { email });
  });

  socket.on('dashboard:realtime:arrival-notification', onAlert);

  return () => socket.disconnect();
}
```

Hook sugerido: conectar WS al montar la app (usuario logueado) o al entrar a la pantalla de paradero; desconectar al logout.

---

## Integración con HUs existentes (ENT-2)

| HU previa | Uso en ENT-3-003 |
|-----------|------------------|
| ENT-2-001 Consulta de rutas | Obtener `routeId` y paraderos (`nodes[].stop`) |
| ENT-2-002 Paraderos cercanos | Punto de entrada natural; `stopId` + rutas que pasan |
| Abordaje / pago | Acción “Preparar pago” → `POST /payment-method-citizen/me`, `GET /card-recharge/cards` |

Permisos RBAC a registrar en ms-security para **CITIZEN**:

| Método | URL |
|--------|-----|
| POST | `/dashboard/realtime/arrival-notification` |
| GET | `/dashboard/realtime/fleet` |
| GET | `/dashboard/realtime/bus/*` |

---

## Comportamiento de negocio (no confundir)

- **“Distancia configurada”** en la HU = hoy el backend usa **ETA en minutos** según `nodes[].estimatedTimeMinutes` de la ruta, **no** metros GPS.
- Dispara cuando `estimatedMinutesToWaitingStop <= anticipationMinutes`.
- Requiere bus con **turno activo** y/o **scheduler del día** + **GPS** actualizado (responsabilidad del conductor / backend).
- El `routeId` elegido debe ser la ruta en la que el bus está realmente en servicio; si no coincide, la flota filtrada sale vacía.

---

## Estados de UI sugeridos

```
[IDLE] → usuario elige ruta, paradero, minutos
[ACTIVATING] → POST en vuelo
[ACTIVE] → subscribed; badge “Alerta activa”; escuchando WS
[ALERT] → llegó evento WS; mostrar modal con acciones
[ERROR] → 401/403/400 con mensaje del backend
```

Copys sugeridos:
- Tras activar con `scheduled: true`: *“Te avisaremos cuando el bus esté a {anticipationMinutes} min o menos.”*
- Tras `sent: true`: *“¡Tu bus está cerca! Placa {plate} — ~{etaMinutes} min.”*
- Sin flota: *“No hay buses en servicio en esta ruta. Puedes dejar la alerta activa.”*

---

## Checklist de implementación

- [ ] Select/radio anticipación 5 / 10 / 15 min
- [ ] Botón activar alerta con `routeId` + `stopId`
- [ ] WebSocket conectado con `dashboard:subscribe-notifications` (email del JWT)
- [ ] Listener `dashboard:realtime:arrival-notification`
- [ ] Toast/modal con ruta, placa, ETA, paradero
- [ ] Acción “Ver en mapa” (`GET /dashboard/realtime/bus/:id` + opcional `subscribe-bus`)
- [ ] Acción “Preparar pago” → pantalla métodos de pago
- [ ] Manejo 401 / 403 / 400
- [ ] Desconectar WS al logout
- [ ] (Opcional) Permiso notificaciones del navegador

---

## Verificación local

Backend:

```bash
cd ms-business && pnpm start:dev
# Swagger: http://localhost:3000/docs
```

Script que simula lo que debe hacer el front (JWT + WS):

```bash
export TOKEN=<jwt-ciudadano>
export EMAIL=<email-login>
export ROUTE_ID=<uuid-ruta-con-bus-activo>
export STOP_ID=<uuid-paradero>
pnpm test:arrival:ws
```

Datos semilla que suelen funcionar en dev:

```
ROUTE_ID=870bc0c5-c2ea-4ad6-91dd-af9c2a9919e9
STOP_ID=d3d3974e-fecb-459a-a605-ffbf6fe237fc
```

Documentación backend: `ms-business/docs/HU-ENTR-3-003-TESTING.md`.

---

## Fuera de alcance (backend actual)

- Push móvil nativa (FCM / APNs)
- Validación JWT en WebSocket de notificaciones (hoy solo email en el body)
- Cancelar / listar suscripciones activas (no hay endpoint DELETE aún)

Si el producto exige cancelar alerta, coordinar nuevo endpoint con backend.
