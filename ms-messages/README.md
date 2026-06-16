# ms-messages

Microservicio NestJS de mensajería (UCaldas). Puerto **3001**.

## HU implementada

- **HU-ENTR-3-004**: mensaje directo, búsqueda de usuarios, bandeja enviados/recibidos, lectura con timestamp, ubicación opcional, notificación en tiempo real vía WebSocket.
- **HU-ENTR-3-006**: creación de grupos de interés, miembros, unirse a grupos públicos, ícono. Solo **ciudadanos con perfil registrado** en PostgreSQL (`persons`, `type=citizen`).

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
socket.on('group:member_added', (payload) => console.log(payload));
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

## Endpoints grupos (HU-006)

| Método | Ruta | Descripción | Restricción |
|--------|------|-------------|-------------|
| POST | `/groups` | Crear grupo (≥2 miembros + creador admin) | Ciudadano registrado |
| GET | `/groups` | Listar grupos públicos y propios | JWT |
| POST | `/groups/:id/members` | Agregar miembros (admin) | Ciudadano registrado |
| POST | `/groups/:id/join` | Unirse a grupo público | Ciudadano registrado |
| POST | `/groups/:id/icon` | Actualizar ícono (admin) | Ciudadano registrado |

**Ciudadano registrado** = fila en `persons` con `type=citizen` y `user_id` = id del JWT (misma BD que ms-business). Conductores u otros perfiles reciben **403**.

Todos los endpoints anteriores usan `@Authenticated()` (JWT válido, sin RBAC por ruta aún).

## Migraciones

Ejecutar migraciones:

```bash
pnpm run migration:run
```

Incluye `1749571200000-InitDirectMessages` y `1749571300000-InitGroups`.
