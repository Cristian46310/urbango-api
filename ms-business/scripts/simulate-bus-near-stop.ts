/**
 * Coloca el GPS del bus ABC-123 cerca del primer paradero de la ruta prueba1
 * para que el ETA al segundo paradero quede dentro de la ventana de anticipación.
 *
 * Uso: npx ts-node -r tsconfig-paths/register scripts/simulate-bus-near-stop.ts
 */
import 'tsconfig-paths/register';
import { AppDataSource } from '../typeorm.config';

const BUS_ID = process.env.BUS_ID ?? '9a6963de-c1ad-45fd-9e80-cead65beb521';
const ROUTE_ID =
  process.env.ROUTE_ID ?? '88733174-6bc6-4103-8661-1249f0e6e08b';
const TARGET_STOP_ID =
  process.env.STOP_ID ?? 'd3d3974e-fecb-459a-a605-ffbf6fe237fc';

async function main() {
  await AppDataSource.initialize();

  const [anchorStop] = await AppDataSource.query(
    `
    SELECT s.latitude, s.longitude, s.name, n.estimated_time_minutes, n."order"
    FROM nodes n
    JOIN stops s ON s.id = n."stopId"
    WHERE n."routeId" = $1
    ORDER BY n."order" ASC
    LIMIT 1
    `,
    [ROUTE_ID],
  );

  const [targetStop] = await AppDataSource.query(
    `
    SELECT s.name, n.estimated_time_minutes
    FROM nodes n
    JOIN stops s ON s.id = n."stopId"
    WHERE n."routeId" = $1 AND n."stopId" = $2
    `,
    [ROUTE_ID, TARGET_STOP_ID],
  );

  if (!anchorStop || !targetStop) {
    throw new Error('Route stops not found');
  }

  const latitude = Number(anchorStop.latitude);
  const longitude = Number(anchorStop.longitude);
  const etaMinutes =
    Number(targetStop.estimated_time_minutes) -
    Number(anchorStop.estimated_time_minutes);

  const existing = await AppDataSource.query(
    'SELECT id FROM gps WHERE "busId" = $1',
    [BUS_ID],
  );

  if (existing.length) {
    await AppDataSource.query(
      `UPDATE gps SET latitude = $1, longitude = $2, "updatedAt" = NOW() WHERE "busId" = $3`,
      [latitude, longitude, BUS_ID],
    );
  } else {
    await AppDataSource.query(
      `INSERT INTO gps (id, latitude, longitude, "busId", "updatedAt")
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW())`,
      [latitude, longitude, BUS_ID],
    );
  }

  console.log('GPS updated', {
    busId: BUS_ID,
    routeId: ROUTE_ID,
    anchorStop: anchorStop.name,
    targetStop: targetStop.name,
    latitude,
    longitude,
    expectedEtaMinutes: etaMinutes,
  });

  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
