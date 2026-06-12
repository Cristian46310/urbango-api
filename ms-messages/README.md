# ms-messages

Microservicio NestJS de mensajería (UCaldas). Puerto **3001**.

## HU implementada

- **HU-ENTR-3-004**: mensaje directo, búsqueda de usuarios, bandeja enviados/recibidos, lectura con timestamp, ubicación opcional, notificación en tiempo real vía WebSocket.
- **HU-ENTR-3-006**: creación de grupos de interés, miembros, unirse a grupos públicos, ícono. Solo **ciudadanos con perfil registrado** en PostgreSQL (`persons`, `type=citizen`).
- **HU-ENTR-3-005**: envío de mensajes a uno o varios grupos, historial grupal, lecturas, eliminación por admin. Solo **conductores registrados** (`persons`, `type=driver`) pueden enviar a grupos.

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

## WebSocket (Socket.IO) — actualización en tiempo real

Al conectar, el servidor une al usuario a todas sus conversaciones (`conversation:{id}`).
**No hace falta polling ni fetch repetido**: escucha eventos y actualiza el estado local.

### Conexión

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: '<jwt>' },
});

// Carga inicial UNA sola vez (REST)
const history = await fetch('/groups/{id}/messages', { headers: { Authorization: `Bearer ${token}` } });

// Tiempo real: append/update sin refetch
socket.on('message:new', (message) => {
  // message.conversationId, message.messageType, message.groupId, message.groupName...
  appendToChat(message);
  updateInboxPreview(message);
});

socket.on('message:read', ({ messageId, conversationId, userId, readAt }) => {
  markReadInUi(messageId, userId, readAt);
});

socket.on('message:deleted', ({ messageId, conversationId }) => {
  removeFromChat(messageId);
});

socket.on('group:member_added', ({ conversationId }) => {
  socket.emit('conversation:join', { conversationId });
});
```

### Unirse a una conversación abierta en UI

Si abres un chat nuevo antes de reconectar el socket:

```javascript
socket.emit('conversation:join', { conversationId: '<uuid>' });
```

### Eventos emitidos por el servidor

| Evento | Cuándo |
|--------|--------|
| `message:new` | Mensaje directo o grupal (todos los miembros de la conversación) |
| `message:read` | Alguien marca leído |
| `message:deleted` | Admin elimina mensaje grupal |
| `group:member_added` | Te agregan a un grupo |

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

## Endpoints mensajes grupales (HU-005)

| Método | Ruta | Descripción | Restricción |
|--------|------|-------------|-------------|
| GET | `/groups/me` | Grupos donde soy miembro | JWT |
| POST | `/messages/group` | Enviar a 1 o N grupos | Conductor registrado + miembro del grupo |
| GET | `/groups/:id/messages` | Historial del grupo | Miembro del grupo |
| GET | `/messages/:id/reads` | Quién leyó (grupal) | Remitente o admin |
| DELETE | `/messages/:id` | Eliminar mensaje grupal | Admin del grupo |

**Conductor registrado** = fila en `persons` con `type=driver`.

Todos los endpoints anteriores usan `@Authenticated()` (JWT válido, sin RBAC por ruta aún).

## Migraciones

Ejecutar migraciones:

```bash
pnpm run migration:run
```

Incluye `1749571200000-InitDirectMessages`, `1749571300000-InitGroups` y `1749571400000-AddMessageSoftDelete`.
