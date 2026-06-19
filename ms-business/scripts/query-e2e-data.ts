import 'tsconfig-paths/register';
import { AppDataSource } from '../typeorm.config';

async function main() {
  await AppDataSource.initialize();
  const schedulers = await AppDataSource.query(`
    SELECT id, route_id, bus_id, date, status
    FROM schedulers
    ORDER BY date DESC
    LIMIT 10
  `);
  const turns = await AppDataSource.query(`
    SELECT t.id, t.status, t."busId", b.plate
    FROM turns t
    JOIN buses b ON t."busId" = b.id
    WHERE t.status = 'in_progress'
    LIMIT 5
  `);
  const nodes = await AppDataSource.query(`
    SELECT n."routeId", n."stopId", n."order", n.estimated_time_minutes,
           s.name, s.latitude, s.longitude
    FROM nodes n
    JOIN stops s ON s.id = n."stopId"
    WHERE n."routeId" = '88733174-6bc6-4103-8661-1249f0e6e08b'
    ORDER BY n."order"
  `);
  const busGps = await AppDataSource.query(`
    SELECT b.id, b.plate, g.latitude, g.longitude,
           (SELECT COUNT(*) FROM schedulers s WHERE s.bus_id = b.id) AS schedulers_count
    FROM buses b
    LEFT JOIN gps g ON g."busId" = b.id
    LIMIT 10
  `);
  console.log(JSON.stringify({ schedulers, turns, nodes, busGps }, null, 2));
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
