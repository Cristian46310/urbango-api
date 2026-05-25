# Mapeo ERD → Entidades NestJS (ms-business)

Referencia de trazabilidad entre el modelo entidad-relación (`docs/Buses.jpeg`) y las
entidades TypeORM del microservicio.  
Mensajería y grupos del ERD están **excluidos** del alcance actual.

---

## Visión general

Las 20 entidades cubren ~95 % del dominio operativo del ERD. Las desviaciones son
refactorizaciones válidas explicadas más abajo, no omisiones.

```
persons (STI)
 ├── Citizen  →  addresses
 │            →  payment_method_citizens  →  payment_methods
 │            →  tickets  →  histories  →  nodes
 │                        →  schedulers
 │                        →  payment_method_citizens
 └── Driver   →  enterprises
               →  turns  →  buses  →  gps
                               →  schedulers  →  routes  →  nodes  →  stops
               →  incidents  →  incident_buses  →  incident_photos
                            →  incident_comments
```

---

## Tabla de equivalencias

| Entidad ERD              | Entidad NestJS            | Tabla BD                   | Estado   | Notas                                                                                          |
| ------------------------ | ------------------------- | -------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Persona                  | `Person`                  | `persons`                  | OK       | Herencia de tabla única (STI). Discriminador: columna `type`.                                  |
| Ciudadano                | `Citizen`                 | `persons` (`type=citizen`) | OK       | `@ChildEntity('citizen')`. Campos extra: `extraInfo`, `address`, `tickets`, `paymentMethods`.  |
| Conductor                | `Driver`                  | `persons` (`type=driver`)  | OK       | `@ChildEntity('driver')`. Campos extra: `licenseNumber`, `licenseExpiry`, `enterprise`.        |
| Dirección                | `Address`                 | `addresses`                | OK       | `Citizen` → `Address` N:1 (ERD plantea 1:1; `@JoinColumn` explícito pendiente si se endurece). |
| Empresa                  | `Enterprise`              | `enterprises`              | OK       | `supervisorEmail` exigido para notificaciones de incidentes (HU-007).                          |
| Ruta                     | `Route`                   | `routes`                   | OK       | Incluye `code` único, `name`, `description`, `price`.                                          |
| Paradero                 | `Stop`                    | `stops`                    | OK       | `code` único y `tipo` añadidos (HU-010). `latitude`/`longitude` para proximidad (HU-002).     |
| Ruta ↔ Paradero (n-n)    | `Node`                    | `nodes`                    | OK       | Sustituye la junction con `order`, `distanceFromPrevious`, `estimatedTimeMinutes`.             |
| Bus                      | `Bus`                     | `buses`                    | OK       | `plate` único, capacidades, `status`, `photoUrl`, `qrCode`.                                    |
| GPS                      | `Gps`                     | `gps`                      | OK       | Relación 1:1 con `Bus`; FK `busId` en `gps`.                                                  |
| Programación             | `Scheduler`               | `schedulers`               | OK       | `route`, `bus`, fecha/hora, `status`, `toleranceMinutes`, `recurrenceType`.                    |
| Boleto                   | `Ticket`                  | `tickets`                  | OK       | `status`, `boardedAt`, `completedAt`, `appliedRate`, `amount`.                                 |
| Método de pago           | `PaymentMethod`           | `payment_methods`          | OK       | Catálogo; `isRechargeable` para tarjetas prepagadas.                                           |
| MétodoPagoCiudadano      | `PaymentMethodCitizen`    | `payment_method_citizens`  | OK       | Wallet del ciudadano: `balance`, `cardNumber`, `type`, `status`.                               |
| Turno                    | `Turn`                    | `turns`                    | OK       | Unifica asignación Bus+Conductor con ventana temporal y estado.                                |
| Incidente                | `Incident`                | `incidents`                | OK       | `type`, `severity`, `status`, GPS punto de reporte, FK a `Turn`/`Driver`/`Enterprise`.        |
| IncidenteBus             | `IncidentBus`             | `incident_buses`           | OK       | Junction Incident ↔ Bus con `isPrimary`.                                                       |
| Foto (de incidente)      | `IncidentPhoto`           | `incident_photos`          | OK       | Almacenada en Supabase; URL pública en `publicUrl`.                                            |
| Historial (validaciones) | `History`                 | `histories`                | OK       | `eventType`: `boarding` / `alighting`. Registro de cada validación en un `Node`.              |
| —                        | `CardRechargeTransaction` | `card_recharge_transactions` | Extra  | Integración ePayco para recargas (HU-013). No está en el ERD base.                            |
| —                        | `IncidentComment`         | `incident_comments`        | Extra    | Seguimiento de incidentes por administradores (HU-008). No está en el ERD base.               |

**Entidades del ERD no implementadas (excluidas del alcance):**
`Mensaje`, `Grupo`, `GrupoPersona`, `DestinatarioPersona`, `DestinatarioGrupo`.

---

## Relaciones M:N del ERD y cómo se resuelven

### Ruta ↔ Paradero

El ERD plantea una relación n-n. En el código se modela como la entidad **`Node`**
([`node.entity.ts`](../src/node/entities/node.entity.ts)):

```
Route 1──N Node N──1 Stop
```

`Node` enriquece la junction con:
- `order` — posición del paradero en la ruta (único por ruta).
- `distanceFromPrevious` — kilómetros desde el paradero anterior.
- `estimatedTimeMinutes` — tiempo parcial; la suma de todos los nodos da el tiempo total (HU-001).

### Conductor ↔ Bus / Conductor ↔ Turno

El ERD plantea dos relaciones n-n. En el código la entidad **`Turn`**
([`turn.entity.ts`](../src/turn/entities/turn.entity.ts)) centraliza ambas:

```
Turn N──1 Bus
Turn N──1 Driver
```

`Turn` agrega estado operativo: `TurnStatus`, `actualStartTime`, `busObservations`,
`gpsActivatedAt`. Para las HUs actuales es suficiente.

> Si el negocio exigiera un catálogo permanente "buses que puede operar el conductor X"
> independiente de turnos, habría que agregar una tabla junction `driver_buses`.

### Boleto ↔ Nodo (validaciones de abordaje/descenso)

```
Ticket 1──N History N──1 Node
```

`History` almacena cada validación con `eventType` (`boarding` / `alighting`),
`eventTimestamp` y la FK al nodo (paradero+orden) donde ocurrió.

---

## Cadena de flujo de un viaje

```
Scheduler (programación)
    └── Ticket (boleto del ciudadano)
            ├── Citizen (quién viaja)
            ├── PaymentMethodCitizen (tarjeta/saldo usado)
            └── History[] (registro de validaciones)
                    └── Node (paradero en la ruta)
                            └── Stop (paradero físico)
```

Para HU-005 ("conductor que operaba"), el conductor se recupera consultando el `Turn`
activo en el momento del viaje: `Turn.bus = Scheduler.bus` y solapamiento temporal de
`Turn.startTime/endTime` con `Ticket.boardedAt`. No requiere FK adicional en `Ticket`.

---

## Cobertura de Historias de Usuario (capa de entidades)

| HU    | Título                           | Entidades suficientes | Notas                                                                                                          |
| ----- | -------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| HU-001 | Consulta de rutas disponibles   | Sí                    | `Route` + `Node` + `Stop`; tiempo total = Σ `estimatedTimeMinutes`.                                           |
| HU-002 | Paraderos cercanos              | Sí                    | `Stop.latitude/longitude`; rutas asociadas vía `Node.route`.                                                   |
| HU-003 | Abordaje y boleto               | Sí                    | `Ticket`, `History`, `PaymentMethodCitizen.balance`, `Bus.capacity`, `Scheduler`.                              |
| HU-004 | Descenso y cierre de viaje      | Sí                    | `Ticket.status`, `History` (`alighting`), `completedAt`.                                                       |
| HU-005 | Visualización de recorrido      | Sí (vía consulta)     | Conductor recuperado por solapamiento temporal `Turn` ↔ `Ticket.boardedAt` + `Scheduler.bus`.                  |
| HU-006 | Inicio de turno                 | Sí                    | `Turn` (`actualStartTime`, `busStatus`, `busObservations`, `gpsActivatedAt`) + `Gps` en `Bus`.                 |
| HU-007 | Reporte de incidente            | Sí                    | `Incident` + `IncidentBus` + `IncidentPhoto` (hasta 5, regla en servicio) + GPS en `Incident`.                 |
| HU-008 | Consulta de incidentes por bus  | Sí                    | `IncidentBus` filtra por `bus`; `IncidentComment` para seguimiento y cambio de estado.                         |
| HU-009 | Creación de ruta                | Sí                    | `Route` + `Node` (orden, distancia, tiempo estimado).                                                          |
| HU-010 | Registro de paradero            | Sí                    | `Stop` con `code` único, `tipo`, `latitude`, `longitude`.                                                      |
| HU-011 | Creación de programación        | Sí (vía consulta)     | `Scheduler` + `Bus` + `Route`. Validación conductor por solapamiento `Turn` — no requiere FK directo.          |
| HU-012 | Registro de bus                 | Sí                    | `Bus` + `Enterprise`; `plate` único, capacidades, `status`, `qrCode`.                                         |
| HU-013 | Recarga ePayco                  | Sí                    | `CardRechargeTransaction` + `PaymentMethodCitizen.balance`.                                                    |
| HU-014 | Ingresos por método de pago     | Sí                    | `Ticket` + `PaymentMethodCitizen` + `PaymentMethod`.                                                           |
| HU-015 | Distribución etaria             | Sí                    | `Person.birthDate`; rangos calculados en servicio/query.                                                       |
| HU-016 | Tendencia de incidentes         | Sí                    | `Incident.type`, `reportedAt`, `enterprise`; agrupación mensual en query.                                     |

---

## Brechas resueltas y pendientes

| Brecha                               | Estado      | Resolución                                                                         |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `Stop` sin `code` ni `tipo`          | **Resuelto** | Campos agregados en `stop.entity.ts` + migración `AddCodeAndTipoToStops`.         |
| `Citizen→Address` sin `@JoinColumn`  | Menor       | TypeORM infiere FK; endurecer solo si se exige unicidad 1:1 estricta.             |
| Inversas ausentes en varias entidades | Menor      | TypeORM no las requiere; agregar solo si un módulo las usa en queries.             |
| `Citizen.paymentMethods` nombre      | Menor       | Tipo real es `PaymentMethodCitizen[]`; renombrar si causa confusión en servicios.  |
| M:N permanente Conductor–Bus         | No requerido | `Turn` cubre asignación operativa; catálogo permanente solo si negocio lo exige.  |
| `Ticket` sin FK a `Turn`/`Driver`    | No requerido | Conductor recuperable por consulta temporal; el ERD tampoco relaciona Ticket–Turn. |

---

## Archivos de referencia

| Archivo                                                               | Propósito                            |
| --------------------------------------------------------------------- | ------------------------------------ |
| [`src/stop/entities/stop.entity.ts`](../src/stop/entities/stop.entity.ts) | Paradero con code y tipo         |
| [`src/node/entities/node.entity.ts`](../src/node/entities/node.entity.ts) | Junction Ruta–Paradero           |
| [`src/ticket/entities/ticket.entity.ts`](../src/ticket/entities/ticket.entity.ts) | Boleto de viaje           |
| [`src/history/entities/history.entity.ts`](../src/history/entities/history.entity.ts) | Validaciones boarding/alighting |
| [`src/turn/entities/turn.entity.ts`](../src/turn/entities/turn.entity.ts) | Turno operativo Bus+Conductor    |
| [`src/incident/entities/incident.entity.ts`](../src/incident/entities/incident.entity.ts) | Incidente con GPS y fotos |
| [`src/shared/entities/person.entitie.ts`](../src/shared/entities/person.entitie.ts) | Base STI Persona           |
