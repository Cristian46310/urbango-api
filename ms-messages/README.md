# ms-messages

Microservicio NestJS de mensajería (UCaldas). Puerto **3001**.

## HU implementada

- **HU-ENTR-3-004**: mensaje directo, búsqueda de usuarios, bandeja enviados/recibidos, lectura con timestamp, ubicación opcional, notificación en tiempo real vía WebSocket.
- **HU-ENTR-3-006**: creación de grupos de interés, miembros, unirse a grupos públicos, ícono. Solo **ciudadanos con perfil registrado** en PostgreSQL (`persons`, `type=citizen`).
- **HU-ENTR-3-005**: envío de mensajes a uno o varios grupos, historial grupal, lecturas, eliminación por admin. Solo **conductores registrados** (`persons`, `type=driver`) pueden enviar a grupos.
- **HU-ENTR-3-008**: alertas masivas (admin): alcance todos/ruta/zona, urgente con push WebSocket, envío programado, contador de destinatarios, estadísticas de lectura. Comunicación unidireccional (`canReply: false`).
- **HU-ENTR-3-009**: directorio de grupos públicos, búsqueda, detalle, unirse con notificación de bienvenida vía WebSocket.
- **HU-ENTR-3-010**: administración de miembros (listar, buscar, promover, remover, bloquear, log de auditoría).

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

socket.on('group:member_added', ({ conversationId, welcomeMessage }) => {
  if (welcomeMessage) showToast(welcomeMessage);
  socket.emit('conversation:join', { conversationId });
});

socket.on('group:member_removed', ({ groupId, groupName, reason }) => {
  showToast(`Fuiste removido de ${groupName}`);
  removeGroupFromUI(groupId);
});

socket.on('group:member_promoted', ({ groupId, role }) => {
  if (role === 'admin') showToast('Fuiste promovido a administrador');
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
| `group:member_added` | Te agregan o te unes a un grupo (`welcomeMessage?` opcional) |
| `group:member_left` | Un admin recibe aviso de que alguien salió o fue removido |
| `group:member_removed` | Fuiste removido (y opcionalmente bloqueado) de un grupo |
| `group:member_promoted` | Tu rol en el grupo cambió (p. ej. promovido a admin) |
| `alert:new` | Alerta masiva no urgente (bandeja del usuario) |
| `alert:push` | Alerta masiva **urgente** — push inmediato al usuario conectado |

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

## Endpoints grupos públicos (HU-009)

| Método | Ruta | Descripción | Restricción |
|--------|------|-------------|-------------|
| GET | `/groups/public?q=&page=&limit=` | Directorio de grupos **solo públicos** con búsqueda por nombre/descripción y `memberCount` | JWT |
| GET | `/groups/:id` | Detalle del grupo (descripción completa, `isMember`, `myRole`, `memberCount`) | JWT; privados solo si eres miembro |
| POST | `/groups/:id/join` | Unirse a grupo público (existente HU-006; ahora valida bloqueos y emite `welcomeMessage`) | Ciudadano registrado |

Respuesta resumen pública (`GET /groups/public`):

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Transporte zona norte",
      "description": "...",
      "memberCount": 12,
      "iconUrl": null,
      "isMember": false
    }
  ],
  "meta": { "page": 1, "limit": 10, "totalItems": 1, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

## Endpoints administración de miembros (HU-010)

Solo **administradores del grupo** (`role=admin` en `group_members`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/groups/:id/members?q=&page=&limit=` | Lista miembros con nombre, email, rol y fecha de unión |
| PATCH | `/groups/:id/members/:userId/role` | Promover/degradar (`{ "role": "admin" \| "member" }`) |
| DELETE | `/groups/:id/members/:userId?block=true&reason=` | Remover miembro; `block=true` impide reingreso |
| GET | `/groups/:id/membership-log?page=&limit=` | Log de auditoría (joined, left, added, removed, promoted, demoted, blocked) |

Acciones registradas en `group_membership_logs`. Usuarios bloqueados en `group_blocked_users` no pueden usar `POST /groups/:id/join`.

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

## Endpoints alertas masivas (HU-008)

Solo usuarios con rol **`ADMIN`** en el claim `roles` del JWT (validado vía ms-security `validate-token`). Los endpoints `/alerts` son para cualquier usuario autenticado.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/mass-alerts/preview-recipients` | Contador de destinatarios antes de enviar |
| POST | `/mass-alerts` | Crear y enviar (inmediato) o programar alerta |
| GET | `/mass-alerts` | Listar alertas (admin) |
| GET | `/mass-alerts/:id` | Detalle de alerta |
| GET | `/mass-alerts/:id/stats` | Estadísticas entrega/lectura |
| GET | `/alerts` | Bandeja de alertas del usuario |
| GET | `/alerts/unread-count` | Contador sin leer |
| PATCH | `/alerts/:id/read` | Marcar alerta como leída |

## Migraciones

Ejecutar migraciones:

```bash
pnpm run migration:run
```

Incluye `1749571200000-InitDirectMessages`, `1749571300000-InitGroups`, `1749571400000-AddMessageSoftDelete`, `1749571500000-InitMassAlerts`, `1749571600000-NormalizeMassAlertScope` y `1749571700000-GroupMembershipAdmin` (bloqueos + log de membresía).
