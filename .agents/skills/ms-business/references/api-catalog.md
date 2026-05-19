# Catálogo API — ms-business

Base URL local: `http://localhost:3000`  
Documentación interactiva: `/docs`

## App

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/` | Health / raíz |

## route

| Método | Ruta |
|--------|------|
| POST | `/route` |
| GET | `/route` |
| GET | `/route/:id` |
| PATCH | `/route/:id` |
| DELETE | `/route/:id` |

## stop

| Método | Ruta |
|--------|------|
| POST | `/stop` |
| GET | `/stop` |
| GET | `/stop/nearby` |
| GET | `/stop/:id` |
| PATCH | `/stop/:id` |
| DELETE | `/stop/:id` |

## node

| Método | Ruta |
|--------|------|
| POST | `/node/route/:routeId/stop/:stopId` |
| GET | `/node` |
| GET | `/node/:id` |
| PATCH | `/node/:id` |
| DELETE | `/node/:id` |

## address

| Método | Ruta |
|--------|------|
| POST | `/address` |
| GET | `/address` |
| GET | `/address/:id` |
| PATCH | `/address/:id` |
| DELETE | `/address/:id` |

## citizen

| Método | Ruta |
|--------|------|
| POST | `/citizen` |
| GET | `/citizen` |
| GET | `/citizen/:id` |
| PATCH | `/citizen/:id` |
| DELETE | `/citizen/:id` |

## driver

| Método | Ruta |
|--------|------|
| POST | `/driver` |
| GET | `/driver` |
| GET | `/driver/:id` |
| PATCH | `/driver/:id` |
| DELETE | `/driver/:id` |

## enterprise

| Método | Ruta |
|--------|------|
| POST | `/enterprise` |
| GET | `/enterprise` |
| GET | `/enterprise/:id` |
| PATCH | `/enterprise/:id` |
| DELETE | `/enterprise/:id` |

## bus

| Método | Ruta |
|--------|------|
| POST | `/bus` |
| GET | `/bus/fleet` | Flota de la empresa del conductor autenticado |
| GET | `/bus` |
| GET | `/bus/:id` |
| PATCH | `/bus/:id` |
| DELETE | `/bus/:id` |
| POST | `/bus/:id/photo` | Multipart, campo `photo` |

## turn

| Método | Ruta |
|--------|------|
| POST | `/turn` |
| GET | `/turn` |
| GET | `/turn/:id` |
| PATCH | `/turn/:id` |
| DELETE | `/turn/:id` |

## scheduler

| Método | Ruta |
|--------|------|
| POST | `/scheduler` |
| GET | `/scheduler` |
| GET | `/scheduler/:id` |
| PATCH | `/scheduler/:id` |
| DELETE | `/scheduler/:id` |

## ticket

| Método | Ruta |
|--------|------|
| POST | `/ticket` |
| GET | `/ticket` |
| GET | `/ticket/:id` |
| PATCH | `/ticket/:id` |
| POST | `/ticket/:id/alight` |
| DELETE | `/ticket/:id` |

## history

| Método | Ruta |
|--------|------|
| POST | `/history` |
| GET | `/history` |
| GET | `/history/:id` |
| GET | `/history/:id/trip-details` |
| PATCH | `/history/:id` |
| DELETE | `/history/:id` |

## payment-method

| Método | Ruta |
|--------|------|
| POST | `/payment-method` |
| GET | `/payment-method` |
| GET | `/payment-method/:id` |
| PATCH | `/payment-method/:id` |
| DELETE | `/payment-method/:id` |

## payment-method-citizen

| Método | Ruta |
|--------|------|
| POST | `/payment-method-citizen` |
| GET | `/payment-method-citizen` |
| GET | `/payment-method-citizen/:id` |
| PATCH | `/payment-method-citizen/:id` |
| DELETE | `/payment-method-citizen/:id` |

## card-recharge (ePayco — HU-ENTR-2-013)

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/card-recharge/config` | JWT (`@Authenticated`) |
| GET | `/card-recharge/cards` | JWT |
| POST | `/card-recharge/cards/register` | JWT — crea/obtiene tarjeta prepagada |
| POST | `/card-recharge/preview` | JWT |
| POST | `/card-recharge/checkout` | JWT — crea referencia y sesión ePayco |
| GET | `/card-recharge/transactions/:reference/status` | JWT |
| POST | `/card-recharge/webhook/confirmation` | Público (ePayco) |

## payment-method (lectura ciudadano)

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/payment-method/rechargeable` | JWT (`@Authenticated`) |
| GET | `/payment-method` | JWT |
| GET | `/payment-method/:id` | JWT |

## payment-method-citizen (ciudadano)

| Método | Ruta | Auth |
|--------|------|------|
| POST | `/payment-method-citizen/me` | JWT — vincula método al ciudadano del token |

## incident-reports

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/incident-reports` | Público (listado paginado) |
| POST | `/incident-reports/driver` | JWT + rol `DRIVER`, multipart fotos |

## Paginación

Varios `GET` list usan `PaginationQueryDto` (`page`, `limit` en query).
