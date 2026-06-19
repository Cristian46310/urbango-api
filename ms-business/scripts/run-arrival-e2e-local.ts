/**
 * E2E local HU-ENTR-3-003 sin JWT: usa DashboardRealtimeService contra la BD real
 * y opcionalmente escucha el WebSocket del servidor en ejecución.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register scripts/run-arrival-e2e-local.ts
 *
 * Variables opcionales:
 *   EMAIL, ROUTE_ID, STOP_ID, ANTICIPATION_MINUTES, BASE_URL
 */
import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { io } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { DashboardRealtimeService } from '../src/dashboard/services/dashboard-realtime.service';
import { AppDataSource } from '../typeorm.config';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.EMAIL ?? 'juan.miranda41303@ucaldas.edu.co';
const ANTICIPATION_MINUTES = Number(process.env.ANTICIPATION_MINUTES ?? 15);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 35_000);

async function resolveRouteAndStop(): Promise<{ routeId: string; stopId: string }> {
  if (process.env.ROUTE_ID && process.env.STOP_ID) {
    return { routeId: process.env.ROUTE_ID, stopId: process.env.STOP_ID };
  }

  await AppDataSource.initialize();
  const rows = await AppDataSource.query(`
    SELECT n."routeId" as route_id, n."stopId" as stop_id, n."order", n.estimated_time_minutes
    FROM nodes n
    ORDER BY n."order" ASC
    LIMIT 20
  `);
  await AppDataSource.destroy();

  if (!rows.length) {
    throw new Error('No hay nodos de ruta en la BD');
  }

  const routeId = rows[0].route_id as string;
  const target =
    rows.find((row: { route_id: string; order: number }) =>
      row.route_id === routeId && row.order >= 2,
    ) ?? rows[0];

  return { routeId, stopId: target.stop_id as string };
}

async function listenForWsEvent(email: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const socket = io(`${BASE_URL}/dashboard/realtime`, {
      path: '/dashboard/realtime/ws',
      transports: ['websocket'],
    });

    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('WS timeout waiting for arrival notification'));
    }, TIMEOUT_MS);

    socket.on('connect', () => {
      socket.emit('dashboard:subscribe-notifications', { email });
    });

    socket.on('dashboard:realtime:arrival-notification', (payload) => {
      clearTimeout(timer);
      socket.close();
      resolve(payload);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function main() {
  const { routeId, stopId } = await resolveRouteAndStop();
  console.log('Using route/stop', { routeId, stopId, email: EMAIL, anticipationMinutes: ANTICIPATION_MINUTES });

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const service = app.get(DashboardRealtimeService);

    const fleet = await service.getRealtimeFleet(undefined, routeId, stopId);
    console.log('Fleet snapshot', {
      count: fleet.items.length,
      firstBus: fleet.items[0]
        ? {
            busId: fleet.items[0].busId,
            plate: fleet.items[0].plate,
            eta: fleet.items[0].estimatedMinutesToWaitingStop,
          }
        : null,
    });

    const wsPromise = listenForWsEvent(EMAIL).catch((error) => {
      console.warn('WS listener warning:', error.message);
      return null;
    });

    // Solo crear suscripción pending; el gateway en ejecución (cada 15s) hace dispatch + WS.
    const pending = await service.createArrivalSubscription({
      email: EMAIL,
      routeId,
      stopId,
      anticipationMinutes: Math.max(ANTICIPATION_MINUTES, 15),
      message: 'Prueba E2E WS HU-ENTR-3-003',
    });

    console.log('Pending subscription created', { id: pending.id });
    console.log('Waiting for gateway cycle (up to 30s) for email + WS...');

    const wsPayload = await wsPromise;
    if (wsPayload) {
      console.log('WS payload received', {
        routeName: wsPayload.routeName,
        plate: wsPayload.plate,
        etaMinutes: wsPayload.etaMinutes,
        trackingPath: wsPayload.trackingPath,
        paymentActionPath: wsPayload.paymentActionPath,
      });
    }

    const checks = {
      subscribed: Boolean(pending.id),
      wsRouteName: wsPayload ? Boolean(wsPayload.routeName) : false,
      wsPlate: wsPayload ? Boolean(wsPayload.plate) : false,
      wsEta: wsPayload ? wsPayload.etaMinutes !== undefined : false,
      wsPaymentAction: wsPayload?.paymentActionPath === '/payment-method-citizen',
      wsTrackingPath: wsPayload ? Boolean(wsPayload.trackingPath) : false,
      validAnticipation: [5, 10, 15].includes(Math.max(ANTICIPATION_MINUTES, 15)),
    };

    console.log('ACCEPTANCE_CHECKS', checks);

    const failed = Object.entries(checks).filter(
      ([, value]) => value === false,
    );
    if (failed.length) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
