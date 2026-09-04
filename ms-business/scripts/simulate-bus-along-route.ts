/**
 * DEMO / DESARROLLO LOCAL ÚNICAMENTE.
 *
 * Simula un bus recorriendo una ruta (paradas + estimated_time_minutes)
 * con interpolación lineal entre paradas. Solo escribe en la tabla `gps`.
 *
 * NO forma parte del runtime de NestJS ni de producción.
 * NO reemplaza ni altera `POST /turn/gps` ni el envío GPS real del conductor.
 * Si un bus real (o la app) escribe GPS después, esa escritura gana.
 *
 * Flujo:
 * 1) Carga nodos de la ruta (order, estimatedTimeMinutes, lat, lng)
 * 2) Interpola entre paradas consecutivas
 * 3) Cada TICK_MS hace upsert del GPS del bus en BD
 * 4) El dashboard sigue leyendo GPS / socket como siempre → el marcador se mueve
 * 5) Si LOOP=true, al terminar reinicia desde la primera parada
 *
 * Uso (PowerShell):
 *   $env:ALLOW_DEMO_GPS="1"
 *   $env:BUS_ID="<uuid>"
 *   $env:ROUTE_ID="<uuid>"
 *   $env:SPEED="20"
 *   $env:TICK_MS="2000"
 *   $env:LOOP="true"
 *   pnpm run test:arrival:route
 */
import 'dotenv/config';
import 'tsconfig-paths/register';
import { AppDataSource } from '../typeorm.config';

type RouteStop = {
  order: number;
  estimatedTimeMinutes: number;
  name: string;
  latitude: number;
  longitude: number;
};

function assertDemoOnly(): { busId: string; routeId: string } {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'simulate-bus-along-route se bloquea con NODE_ENV=production (solo demo/dev).',
    );
  }

  const allow =
    process.env.ALLOW_DEMO_GPS === '1' ||
    process.env.ALLOW_DEMO_GPS === 'true';
  if (!allow) {
    throw new Error(
      'Falta ALLOW_DEMO_GPS=1. Este script es solo para demos locales y no debe correrse sin consentimiento explícito.',
    );
  }

  const busId = process.env.BUS_ID?.trim();
  const routeId = process.env.ROUTE_ID?.trim();
  if (!busId || !routeId) {
    throw new Error(
      'Debes pasar BUS_ID y ROUTE_ID explícitos (sin defaults) para evitar mover un bus equivocado.',
    );
  }

  return { busId, routeId };
}

const SPEED = Math.max(0.1, Number(process.env.SPEED ?? 10));
const TICK_MS = Math.max(500, Number(process.env.TICK_MS ?? 2000));
const LOOP = String(process.env.LOOP ?? 'false').toLowerCase() === 'true';
const MIN_SEGMENT_MINUTES = 1;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertGps(
  busId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const existing = await AppDataSource.query(
    'SELECT id FROM gps WHERE "busId" = $1',
    [busId],
  );

  if (existing.length) {
    await AppDataSource.query(
      `UPDATE gps SET latitude = $1, longitude = $2, "updatedAt" = NOW() WHERE "busId" = $3`,
      [latitude, longitude, busId],
    );
    return;
  }

  await AppDataSource.query(
    `INSERT INTO gps (id, latitude, longitude, "busId", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, NOW())`,
    [latitude, longitude, busId],
  );
}

async function loadStops(routeId: string): Promise<RouteStop[]> {
  const rows = await AppDataSource.query(
    `
    SELECT
      n."order" AS order,
      n.estimated_time_minutes AS "estimatedTimeMinutes",
      s.name AS name,
      s.latitude AS latitude,
      s.longitude AS longitude
    FROM nodes n
    JOIN stops s ON s.id = n."stopId"
    WHERE n."routeId" = $1
    ORDER BY n."order" ASC
    `,
    [routeId],
  );

  return rows.map(
    (row: {
      order: number;
      estimatedTimeMinutes: number | string;
      name: string;
      latitude: number | string;
      longitude: number | string;
    }) => ({
      order: Number(row.order),
      estimatedTimeMinutes: Number(row.estimatedTimeMinutes),
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    }),
  );
}

function segmentDurationMinutes(from: RouteStop, to: RouteStop): number {
  const delta = to.estimatedTimeMinutes - from.estimatedTimeMinutes;
  return Math.max(MIN_SEGMENT_MINUTES, delta > 0 ? delta : MIN_SEGMENT_MINUTES);
}

async function runOnce(busId: string, stops: RouteStop[]): Promise<void> {
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const durationMs =
      (segmentDurationMinutes(from, to) * 60_000) / SPEED;
    const steps = Math.max(1, Math.ceil(durationMs / TICK_MS));

    console.log(
      `Segmento ${from.order}→${to.order}: ${from.name} → ${to.name} ` +
        `(~${(durationMs / 1000).toFixed(1)}s a SPEED=${SPEED}x, ${steps} ticks)`,
    );

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const latitude = lerp(from.latitude, to.latitude, t);
      const longitude = lerp(from.longitude, to.longitude, t);
      await upsertGps(busId, latitude, longitude);
      console.log(
        `  GPS ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (t=${t.toFixed(2)})`,
      );
      if (step < steps) {
        await sleep(TICK_MS);
      }
    }
  }
}

async function main() {
  const { busId, routeId } = assertDemoOnly();
  await AppDataSource.initialize();

  const stops = await loadStops(routeId);
  if (stops.length < 2) {
    throw new Error(
      `La ruta ${routeId} necesita al menos 2 paradas (encontradas: ${stops.length})`,
    );
  }

  console.log('[DEMO] Simulación de ruta (no afecta runtime Nest ni GPS real)', {
    busId,
    routeId,
    stops: stops.length,
    speed: `${SPEED}x`,
    tickMs: TICK_MS,
    loop: LOOP,
  });

  do {
    await runOnce(busId, stops);
    if (LOOP) {
      console.log('[DEMO] Fin de ruta — reiniciando (LOOP=true)…');
    }
  } while (LOOP);

  console.log('[DEMO] Simulación terminada.');
  await AppDataSource.destroy();
}

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
