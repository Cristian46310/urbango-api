# ms-messages

Microservicio NestJS de mensajería (UCaldas). Puerto **3001**.

## HU implementada

- **HU-ENTR-3-004**: mensaje directo, búsqueda de usuarios, bandeja enviados/recibidos, lectura con timestamp, ubicación opcional, notificación en tiempo real vía WebSocket.

## Requisitos

- Node 22 + pnpm
- PostgreSQL (base dedicada `ms_messages`)
- ms-security en `:8080`

## Variables de entorno

Copia `.env.example` a `.env`:

```env
PORT=3001
DB_URL=postgresql://user:password@localhost:5432/ms_messages
MS_SECURITY_URL=http://localhost:8080
```

## Desarrollo

```bash
cd ms-messages
pnpm install
pnpm run start:dev
```

Swagger: `http://localhost:3001/docs`

## WebSocket (Socket.IO)

Conéctate al mismo host/puerto con JWT:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: '<jwt>' },
});

socket.on('message:new', (message) => console.log(message));
socket.on('message:read', (payload) => console.log(payload));
```

## Endpoints principales (HU-004)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users/search?q=` | Buscar personas (proxy a ms-security `GET /api/public/users?q=`) |
| POST | `/conversations/direct` | Obtener/crear hilo directo |
| POST | `/messages/direct` | Enviar mensaje directo |
| GET | `/inbox` | Mensajes recibidos |
| GET | `/messages/sent` | Mensajes enviados |
| PATCH | `/messages/:id/read` | Marcar como leído |

Todos los endpoints anteriores usan `@Authenticated()` (JWT válido, sin RBAC por ruta aún).

## Migraciones

Ejecutar la migración `src/migrations/1749571200000-InitDirectMessages.ts` con el flujo TypeORM del proyecto (pendiente script CLI si se requiere automatización).
