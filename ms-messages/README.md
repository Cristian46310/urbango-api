# ms-messages

Microservicio NestJS de mensajería (UCaldas). Puerto **3001**.

## HU implementada

- **HU-ENTR-3-004**: mensaje directo, búsqueda de usuarios, bandeja enviados/recibidos, lectura con timestamp, ubicación opcional, notificación en tiempo real vía WebSocket.
- **HU-ENTR-3-006**: creación de grupos de interés, miembros, unirse a grupos públicos, ícono. Solo **ciudadanos con perfil registrado** en PostgreSQL (`persons`, `type=citizen`).
- **HU-ENTR-3-005**: envío de mensajes a uno o varios grupos, historial grupal, lecturas, eliminación por admin. Solo **conductores registrados** (`persons`, `type=driver`) pueden enviar a grupos.
- **HU-ENTR-3-008**: alertas masivas (admin): alcance todos/ruta/zona, urgente con push WebSocket, envío programado, contador de destinatarios, estadísticas de lectura. Comunicación unidireccional (`canReply: false`).
- **HU-ENTR-3-009**: directorio de grupos públicos, búsqueda, detalle, unirse con notificación de bienvenida vía WebSocket.
- **HU-ENTR-3-010**: administración de miembros (listar, buscar, promover, remover, bloquear, log de auditoría).

## Modelo de producto (grupos)

Los grupos **no** son un chat bidireccional ciudadano↔ciudadano:

| Acción | Quién |
|--------|--------|
| Crear / unirse / administrar miembros | Ciudadano (`persons.type=citizen`) |
| Publicar mensajes grupales | Conductor (`persons.type=driver`) y miembro del grupo |
| Conductor unirse solo | No: debe ser invitado por un admin del grupo |

## Requisitos

- Node 22 + pnpm
- PostgreSQL: **la misma base que ms-business** (esquema compartido). Las tablas de mensajería se crean con las migraciones de este servicio; perfiles y alertas por ruta/zona leen `persons`, `tickets`, `routes`, etc.
- ms-security en `:8080` con `MS_SECURITY_INTERNAL_KEY` alineada

## Variables de entorno

Copia `.env.example` a `.env`:

```env
PORT=3001
NODE_ENV=development
DB_URL=postgresql://user:password@localhost:5432/postgres
MS_SECURITY_URL=http://localhost:8080
MS_SECURITY_INTERNAL_KEY=<generate_random_32+_chars>
# CORS_ALLOWED_ORIGINS=http://localhost:5173
```

| Variable | Obligatoria | Notas |
|----------|-------------|--------|
| `DB_URL` | Sí | Misma Postgres que ms-business |
| `MS_SECURITY_URL` | Sí | Sin fallback a localhost en código |
| `MS_SECURITY_INTERNAL_KEY` | Sí | Header `X-Internal-Key` para `/api/internal/users` |
| `CORS_ALLOWED_ORIGINS` | En producción | Lista separada por comas; en development se puede omitir |
| `PORT` | No | Default `3001` |

## Desarrollo

```bash
cd ms-messages
pnpm install
pnpm run migration:run
pnpm run start:dev
```

Verificación rápida: `pnpm run verify` (lint + build).

Swagger: `http://localhost:3001/docs`

## WebSocket (Socket.IO) — tiempo real

- **Namespace:** `/messages`
- **Path:** `/messages/ws`
- **Auth:** `auth: { token: '<jwt>' }` o header `Authorization: Bearer …` (solo en handshake)
- **Réplicas:** una sola instancia por ahora (conexiones en memoria). Proxies deben permitir WebSocket upgrade.

Al conectar, el servidor une al usuario a `user:{id}` y a todas sus conversaciones (`conversation:{id}`).

**Reconnect:** Socket.IO re-ejecuta el handshake y re-une rooms. Tras reconnect, **vuelve a cargar historial por REST** (no hay sync incremental aún). El servidor puede emitir `sync:required`.

### Conexión

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/messages', {
  path: '/messages/ws',
  auth: { token: '<jwt>' },
});

socket.on('connect_error', (err) => {
  console.error('WS auth/connect failed', err.message);
});

socket.on('error', (payload) => {
  // e.g. { code: 'UNAUTHORIZED', message: '...' }
  console.error(payload);
});

socket.on('sync:required', () => {
  // Refetch inbox / open conversation history via REST
});

// Carga inicial UNA sola vez (REST), luego escucha eventos
const history = await fetch('/groups/{id}/messages', {
  headers: { Authorization: `Bearer ${token}` },
});

socket.on('message:new', (message) => {
  appendToChat(message);
  updateInboxPreview(message);
});

socket.on('message:read', ({ messageId, conversationId, userId, readAt }) => {
  markReadInUi(messageId, userId, readAt);
});

socket.on('message:deleted', ({ messageId, conversationId }) => {
  removeFromChat(messageId);
});

socket.on('group:member_added', ({ conversationId, welcomeMessage }) => {
  if (welcomeMessage) showToast(welcomeMessage);
  // Fallback si el auto-join del servidor falló
  socket.emit('conversation:join', { conversationId });
});

socket.on('group:member_removed', ({ groupId, groupName }) => {
  showToast(`Fuiste removido de ${groupName}`);
  removeGroupFromUI(groupId);
});

socket.on('group:member_promoted', ({ groupId, role }) => {
  if (role === 'admin') showToast('Fuiste promovido a administrador');
});

socket.on('alert:new', (alert) => { /* bandeja */ });
socket.on('alert:push', (alert) => { /* urgente */ });
```

### Unirse a una conversación abierta en UI

```javascript
socket.emit('conversation:join', { conversationId: '<uuid>' });
```

### Eventos emitidos por el servidor

| Evento | Cuándo |
|--------|--------|
| `message:new` | Mensaje directo o grupal |
| `message:read` | Alguien marca leído |
| `message:deleted` | Admin elimina mensaje grupal |
| `group:member_added` | Te agregan o te unes |
| `group:member_left` | Aviso a admins de salida/remoción |
| `group:member_removed` | Fuiste removido |
| `group:member_promoted` | Cambio de rol (incluye demote) |
| `alert:new` | Alerta no urgente |
| `alert:push` | Alerta urgente |
| `sync:required` | Tras connect/reconnect: refetch REST recomendado |
| `error` | Fallo de auth u otro error WS antes de disconnect |

## Endpoints principales (HU-004)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users/search?q=` | Buscar personas (ms-security `GET /api/internal/users` + `X-Internal-Key`) |
| POST | `/conversations/direct` | Obtener/crear hilo directo |
| POST | `/messages/direct` | Enviar mensaje directo |
| GET | `/inbox` | Mensajes recibidos |
| GET | `/inbox/unread-count` | No leídos de chat |
| GET | `/messages/sent` | Mensajes enviados |
| PATCH | `/messages/:id/read` | Marcar como leído |
| GET | `/conversations/:id/messages` | Historial de conversación |

## Endpoints grupos (HU-006 / HU-009 / HU-010)

Ver tablas anteriores en Swagger `/docs`. Resumen:

- Ciudadano: crear, join públicos, agregar miembros, ícono
- Admin del grupo: roles, remove/block, membership-log
- JWT: listar, detalle, `GET /groups/me`, historial `GET /groups/:id/messages`
- Conductor: `POST /messages/group`

**Ciudadano registrado** = `persons.type=citizen` y `user_id` = JWT. **Conductor** = `persons.type=driver`.

## Endpoints alertas masivas (HU-008)

Solo JWT con rol **`ADMIN`**. Usuario autenticado: `/alerts/*`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/mass-alerts/preview-recipients` | Contador de destinatarios |
| POST | `/mass-alerts` | Crear / programar |
| GET | `/mass-alerts` | Listar (admin) |
| GET | `/mass-alerts/:id` | Detalle |
| GET | `/mass-alerts/:id/stats` | Stats |
| GET | `/alerts` | Bandeja usuario |
| GET | `/alerts/unread-count` | Contador alertas |
| PATCH | `/alerts/:id/read` | Marcar leída |

## Migraciones

```bash
pnpm run migration:run
```

Incluye init DM/groups, soft-delete, mass-alerts, membership admin, uuid extension, DM uniqueness e índices.
