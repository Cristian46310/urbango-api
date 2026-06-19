import { io } from 'socket.io-client';

const URL = process.env.REALTIME_WS_URL ?? 'http://localhost:3000/dashboard/realtime';
const PATH = '/dashboard/realtime/ws';
const TIMEOUT_MS = 35_000;

const summaries = [];
const fleets = [];
let busDetail = null;

const socket = io(URL, {
  path: PATH,
  transports: ['websocket'],
});

const timeout = setTimeout(() => {
  console.error('TIMEOUT: no second summary within 35s');
  socket.close();
  process.exit(1);
}, TIMEOUT_MS);

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('dashboard:realtime:summary', (data) => {
  summaries.push(data.updatedAt);
  console.log('SUMMARY', {
    updatedAt: data.updatedAt,
    totalPassengersInTransit: data.totalPassengersInTransit,
    incidents: data.incidents?.length ?? 0,
    fullBusAlerts: data.fullBusAlerts?.length ?? 0,
    fleetSize: data.fleet?.items?.length ?? 0,
  });

  if (summaries.length >= 2) {
    clearTimeout(timeout);
    const first = new Date(summaries[0]).getTime();
    const second = new Date(summaries[1]).getTime();
    const deltaSec = (second - first) / 1000;
    console.log('REFRESH_DELTA_SEC', deltaSec.toFixed(1));
    if (deltaSec < 25 || deltaSec > 35) {
      console.warn('WARN: expected ~30s between summary pushes');
    }
    socket.close();
    process.exit(0);
  }
});

socket.on('dashboard:realtime:fleet', (data) => {
  fleets.push(data);
  const items = data.items ?? [];
  console.log(
    'FLEET',
    items.map((b) => ({
      plate: b.plate,
      statusColor: b.statusColor,
      lat: b.lat,
      lng: b.lng,
      busId: b.busId,
    })),
  );

  if (!busDetail && items[0]?.busId) {
    socket.emit('dashboard:subscribe-bus', { busId: items[0].busId });
  }
});

socket.on('dashboard:realtime:bus', (bus) => {
  busDetail = bus;
  console.log('BUS_DETAIL', {
    plate: bus.plate,
    routeName: bus.routeName,
    activePassengers: bus.activePassengers,
    statusColor: bus.statusColor,
  });
});

socket.on('connect_error', (err) => {
  console.error('CONNECT_ERROR', err.message);
  process.exit(1);
});
