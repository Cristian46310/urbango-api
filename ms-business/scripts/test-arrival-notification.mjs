/**
 * HU-ENTR-3-003 — prueba manual de notificación de bus próximo.
 *
 * Variables de entorno:
 *   TOKEN              JWT de ciudadano (ms-security login)
 *   EMAIL              Email del ciudadano (debe coincidir con la suscripción)
 *   ROUTE_ID           UUID de la ruta
 *   STOP_ID            UUID del paradero en esa ruta
 *   ANTICIPATION_MINUTES  5 | 10 | 15 (default 10)
 *   BASE_URL           http://localhost:3000 (default)
 *   TIMEOUT_MS         45000 (default)
 *
 * Ejemplo:
 *   TOKEN=eyJ... EMAIL=user@example.com ROUTE_ID=... STOP_ID=... \
 *     node scripts/test-arrival-notification.mjs
 */
import { io } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const WS_URL = `${BASE_URL}/dashboard/realtime`;
const WS_PATH = '/dashboard/realtime/ws';
const TOKEN = process.env.TOKEN;
const EMAIL = process.env.EMAIL;
const ROUTE_ID = process.env.ROUTE_ID;
const STOP_ID = process.env.STOP_ID;
const ANTICIPATION_MINUTES = Number(process.env.ANTICIPATION_MINUTES ?? 10);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 45_000);

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
}

requireEnv('TOKEN', TOKEN);
requireEnv('EMAIL', EMAIL);
requireEnv('ROUTE_ID', ROUTE_ID);
requireEnv('STOP_ID', STOP_ID);

const socket = io(WS_URL, {
  path: WS_PATH,
  transports: ['websocket'],
});

let subscribed = false;
let httpResult = null;

const timeout = setTimeout(() => {
  console.error('TIMEOUT: no arrival notification within', TIMEOUT_MS, 'ms');
  console.error('HTTP result:', httpResult);
  socket.close();
  process.exit(1);
}, TIMEOUT_MS);

socket.on('connect', async () => {
  console.log('WS connected', socket.id);
  socket.emit(
    'dashboard:subscribe-notifications',
    { email: EMAIL },
    (ack) => {
      console.log('NOTIFICATIONS_SUBSCRIBE', ack);
      subscribed = ack?.subscribed === true;
    },
  );

  try {
    const response = await fetch(
      `${BASE_URL}/dashboard/realtime/arrival-notification`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: ROUTE_ID,
          stopId: STOP_ID,
          anticipationMinutes: ANTICIPATION_MINUTES,
          message: 'Prueba HU-ENTR-3-003',
        }),
      },
    );

    const body = await response.json().catch(() => ({}));
    httpResult = { status: response.status, body };
    console.log('HTTP_POST_ARRIVAL', httpResult);

    if (!response.ok) {
      clearTimeout(timeout);
      socket.close();
      process.exit(1);
    }

    if (body.sent === true) {
      console.log('Notification dispatched immediately (email + pending WS cycle)');
    } else if (body.scheduled === true) {
      console.log(
        'Subscription scheduled; waiting for WS event (ETA may be above window)',
        { etaMinutes: body.etaMinutes, stopName: body.stopName },
      );
    }
  } catch (error) {
    console.error('HTTP error', error);
    clearTimeout(timeout);
    socket.close();
    process.exit(1);
  }
});

socket.on('dashboard:realtime:arrival-notification', (payload) => {
  clearTimeout(timeout);
  console.log('ARRIVAL_NOTIFICATION', {
    email: payload.email,
    routeName: payload.routeName,
    plate: payload.plate,
    etaMinutes: payload.etaMinutes,
    stopName: payload.stopName,
    trackingPath: payload.trackingPath,
    paymentActionPath: payload.paymentActionPath,
    busId: payload.busId,
    lat: payload.status?.lat,
    lng: payload.status?.lng,
  });

  const checks = {
    subscribed,
    hasRouteName: Boolean(payload.routeName),
    hasPlate: Boolean(payload.plate),
    hasEta: payload.etaMinutes !== undefined,
    hasTrackingPath: Boolean(payload.trackingPath),
    hasPaymentAction: payload.paymentActionPath === '/payment-method-citizen',
    hasLiveCoords:
      payload.status?.lat !== undefined && payload.status?.lng !== undefined,
  };
  console.log('ACCEPTANCE_CHECKS', checks);

  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  socket.close();
  process.exit(failed.length ? 1 : 0);
});

socket.on('connect_error', (error) => {
  console.error('CONNECT_ERROR', error.message);
  clearTimeout(timeout);
  process.exit(1);
});
