# HU-ENTR-3-003 — Notificación de bus próximo

Guía de prueba y estado de implementación en **ms-business**.

## Estado de implementación

| Criterio | Backend | Notas |
|----------|---------|-------|
| Activar notificación por ruta + paradero | OK | `POST /dashboard/realtime/arrival-notification` |
| Anticipación 5 / 10 / 15 min | OK | Validado en `CreateArrivalNotificationDto` |
| Disparo al acercarse | Parcial | Usa **ETA en minutos** (nodos de ruta), no geofencing en metros |
| Contenido: ruta, ETA, placa | OK | Email + evento WebSocket |
| Ubicación en tiempo real desde la notificación | Parcial | `trackingPath` + `status.lat/lng` en WS; falta UI |
| Acción rápida método de pago | Parcial | `paymentActionPath: /payment-method-citizen` en WS; falta UI |
| Push móvil nativa (FCM/APNs) | No | Solo email (ms-notifications) + WebSocket |

## Endpoints y eventos

### REST

```
POST /dashboard/realtime/arrival-notification
Authorization: Bearer <JWT con rol CITIZEN>
```

Body:

```json
{
  "routeId": "<uuid>",
  "stopId": "<uuid>",
  "anticipationMinutes": 10,
  "message": "Opcional"
}
```

Respuesta: `{ subscribed, sent, scheduled, etaMinutes?, stopName? }`.

Consulta de seguimiento:

```
GET /dashboard/realtime/bus/:busId?stopId=<uuid>
```

### WebSocket

- Namespace: `/dashboard/realtime`
- Path engine: `/dashboard/realtime/ws`
- Suscribirse: emit `dashboard:subscribe-notifications` con `{ "email": "..." }`
- Evento de alerta: `dashboard:realtime:arrival-notification`

Payload del evento incluye: `routeName`, `plate`, `etaMinutes`, `stopName`, `status`, `trackingPath`, `paymentActionPath`.

El job del gateway revisa suscripciones pendientes cada **15 segundos**.

## Prerrequisitos

1. PostgreSQL con migración `CreateNotificationSubscriptions1781539199999` aplicada.
2. **ms-business** en `:3000` (`pnpm start:dev`).
3. **ms-security** en `:8080` (solo para prueba REST con JWT).
4. **ms-notifications** en `:8000` con `MS_NOTIFICATION_URL` en `.env` de ms-business.
5. Datos de dominio: ruta con nodos, bus con turno `in_progress`, scheduler del día y GPS actualizado.

Verificar migración:

```bash
npx ts-node -r tsconfig-paths/register -e "
const { AppDataSource } = require('./typeorm.config');
(async () => {
  await AppDataSource.initialize();
  const r = await AppDataSource.query(\"SELECT to_regclass('public.notification_subscriptions') as tbl\");
  console.log(r[0]);
  await AppDataSource.destroy();
})();
"
```

## Pruebas automatizadas

```bash
cd ms-business
pnpm test:arrival
```

Cubre dispatch cuando ETA ≤ ventana de anticipación y utilidades de rooms WebSocket.

## Prueba E2E local (sin JWT)

Usa el servicio directamente contra la BD y escucha el WS del servidor en ejecución:

```bash
cd ms-business
pnpm test:arrival:gps   # opcional: acerca el bus ABC-123 al primer paradero
pnpm test:arrival:e2e
```

Variables opcionales: `EMAIL`, `ROUTE_ID`, `STOP_ID`, `ANTICIPATION_MINUTES`, `BASE_URL`.

**Importante:** `ROUTE_ID` debe coincidir con la ruta del scheduler del bus activo. En datos semilla, el bus `ABC-123` suele resolver a la ruta `preubaFinal`:

```bash
ROUTE_ID=870bc0c5-c2ea-4ad6-91dd-af9c2a9919e9 \
STOP_ID=d3d3974e-fecb-459a-a605-ffbf6fe237fc \
pnpm test:arrival:e2e
```

El script crea una suscripción **pending** y espera el ciclo del gateway (~15 s) para validar email + evento WS.

### Comportamiento REST vs WebSocket

- `POST /dashboard/realtime/arrival-notification` con ETA ya en ventana: responde `sent: true` y envía **email** de inmediato, pero **no emite WS** en ese mismo instante.
- El evento `dashboard:realtime:arrival-notification` lo emite el **gateway** al procesar suscripciones con `notifiedAt IS NULL` en su intervalo de 15 s.

## Prueba E2E con JWT (flujo ciudadano real)

1. Login en ms-security:

```bash
export TOKEN=$(curl -s -X POST http://localhost:8080/api/public/security/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ciudadano>","password":"<password>"}' | jq -r .token)
```

2. Obtener `routeId` y `stopId` (Swagger `/docs` → `GET /dashboard/realtime/fleet` o datos semilla).

3. Ejecutar script WebSocket + POST:

```bash
export EMAIL=<mismo-email-del-login>
export ROUTE_ID=<uuid>
export STOP_ID=<uuid>
export ANTICIPATION_MINUTES=10
pnpm test:arrival:ws
```

4. Validar:
   - HTTP `subscribed: true`
   - Si ETA ya está en ventana: `sent: true` + email en ms-notifications
   - Evento WS con ruta, placa, ETA, `trackingPath`, `paymentActionPath`

## Si no dispara la notificación

El bus puede estar fuera de la ventana de ETA o en otra ruta. Pasos:

1. Ver flota sin filtro de ruta en Swagger o con `scripts/query-e2e-data.ts`.
2. Acercar GPS del bus de prueba:

```bash
pnpm test:arrival:gps
# o con POST /turn/gps (JWT conductor)
```

3. Usar la ruta que reporta la flota para ese bus (`routeId` en la respuesta).

Simular acercamiento con GPS del conductor:

```bash
curl -X POST http://localhost:3000/turn/gps \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": <cerca_del_paradero>, "longitude": <cerca_del_paradero>}'
```

Vuelve a consultar la flota hasta que `estimatedMinutesToWaitingStop` ≤ `anticipationMinutes`.

También puedes usar anticipación **15** min para ampliar la ventana en pruebas.

## Datos útiles en BD

```bash
npx ts-node -r tsconfig-paths/register scripts/query-e2e-data.ts
```

Lista ciudadanos, schedulers del día y posiciones GPS.

## Gaps conocidos (fuera de ms-business)

1. **Frontend ciudadano**: pantalla de activación, notificación del navegador/app, mapa en vivo, botón “Preparar pago”.
2. **Push móvil nativa**: no hay FCM/APNs en ms-notifications; hoy es email + WebSocket.
3. **Distancia vs minutos**: la HU habla de “distancia configurada”; el backend usa ETA derivado de `estimated_time_minutes` en nodos.
4. **Seguridad WS**: `dashboard:subscribe-notifications` no valida JWT; cualquier cliente puede unirse al room de un email. Atar al token en producción.
5. **REST inmediato sin WS**: si `POST /arrival-notification` dispara al instante (`sent: true`), el email sale pero el evento WS solo llega si el gateway procesa la suscripción antes de marcar `notifiedAt`, o en un ciclo posterior con suscripción pending.

## Checklist de demo

- [ ] `pnpm test:arrival` pasa
- [ ] Tabla `notification_subscriptions` existe
- [ ] `POST /dashboard/realtime/arrival-notification` con CITIZEN → `subscribed: true`
- [ ] Solo acepta anticipación 5, 10 o 15
- [ ] Con bus en servicio y ETA en ventana → email y/o WS `dashboard:realtime:arrival-notification`
- [ ] Payload con ruta, placa, ETA
- [ ] `GET /dashboard/realtime/bus/:id` devuelve posición en vivo
- [ ] `paymentActionPath` presente en evento WS
