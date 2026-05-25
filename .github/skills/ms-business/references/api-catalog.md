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
| PUT | `/route/:id` |
| DELETE | `/route/:id` |

## stop

| Método | Ruta |
|--------|------|
| POST | `/stop` |
| GET | `/stop` |
| GET | `/stop/nearby` |
| GET | `/stop/:id` |
| PUT | `/stop/:id` |
| DELETE | `/stop/:id` |

## node

| Método | Ruta |
|--------|------|
| POST | `/node/route/:routeId/stop/:stopId` |
| GET | `/node` |
| GET | `/node/:id` |
| PUT | `/node/:id` |
| DELETE | `/node/:id` |

## address

| Método | Ruta |
|--------|------|
| POST | `/address` |
| GET | `/address` |
| GET | `/address/:id` |
| PUT | `/address/:id` |
| DELETE | `/address/:id` |

## citizen

| Método | Ruta |
|--------|------|
| POST | `/citizen` |
| GET | `/citizen` |
| GET | `/citizen/:id` |
| PUT | `/citizen/:id` |
| DELETE | `/citizen/:id` |

## driver

| Método | Ruta |
|--------|------|
| POST | `/driver` |
| GET | `/driver` |
| GET | `/driver/:id` |
| PUT | `/driver/:id` |
| DELETE | `/driver/:id` |

## enterprise

| Método | Ruta |
|--------|------|
| POST | `/enterprise` |
| GET | `/enterprise` |
| GET | `/enterprise/:id` |
| PUT | `/enterprise/:id` |
| DELETE | `/enterprise/:id` |

## bus

| Método | Ruta |
|--------|------|
| POST | `/bus` |
| GET | `/bus` |
| GET | `/bus/:id` |
| PUT | `/bus/:id` |
| DELETE | `/bus/:id` |

## turn

| Método | Ruta |
|--------|------|
| POST | `/turn` |
| GET | `/turn` |
| GET | `/turn/:id` |
| PUT | `/turn/:id` |
| DELETE | `/turn/:id` |

## scheduler

| Método | Ruta |
|--------|------|
| POST | `/scheduler` |
| GET | `/scheduler` |
| GET | `/scheduler/:id` |
| PUT | `/scheduler/:id` |
| DELETE | `/scheduler/:id` |

## ticket

| Método | Ruta |
|--------|------|
| POST | `/ticket` |
| GET | `/ticket` |
| GET | `/ticket/:id` |
| PUT | `/ticket/:id` |
| POST | `/ticket/:id/alight` |
| DELETE | `/ticket/:id` |

## history

| Método | Ruta |
|--------|------|
| POST | `/history` |
| GET | `/history` |
| GET | `/history/:id` |
| GET | `/history/:id/trip-details` |
| PUT | `/history/:id` |
| DELETE | `/history/:id` |

## payment-method

| Método | Ruta |
|--------|------|
| POST | `/payment-method` |
| GET | `/payment-method` |
| GET | `/payment-method/:id` |
| PUT | `/payment-method/:id` |
| DELETE | `/payment-method/:id` |

## payment-method-citizen

| Método | Ruta |
|--------|------|
| POST | `/payment-method-citizen` |
| GET | `/payment-method-citizen` |
| GET | `/payment-method-citizen/:id` |
| PUT | `/payment-method-citizen/:id` |
| DELETE | `/payment-method-citizen/:id` |

## incident-reports

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/incident-reports` | Público (listado paginado) |
| GET | `/incident-reports/bus/:busId` | JWT (`type`, `status`, `page`, `limit` en query) |
| POST | `/incident-reports/driver` | JWT + rol `DRIVER`, multipart fotos |
| GET | `/incident-reports/:incidentId/comments` | JWT |
| POST | `/incident-reports/:incidentId/comments` | JWT |
| PUT | `/incident-reports/:incidentId/status` | JWT |

## dashboard

| Método | Ruta | Auth | Query |
|--------|------|------|-------|
| GET | `/dashboard/payment-method-income` | JWT + permiso ms-security | `months` = `3` \| `6` \| `12` (default `6`) |
| GET | `/dashboard/payment-method-income/export` | JWT + permiso ms-security | `months` = `3` \| `6` \| `12` |
| GET | `/dashboard/incident-trend-by-type` | JWT + permiso ms-security | `months` = `3` \| `6` \| `12` (default `12`); `enterpriseId` (UUID, opcional) |
| GET | `/dashboard/incident-trend-by-type/export` | JWT + permiso ms-security | `months` = `3` \| `6` \| `12`; `enterpriseId` (UUID, opcional) |

**Ingresos por método de pago** — respuesta JSON: `period`, `labels` (meses `YYYY-MM`), `datasets[]` con `paymentMethodId`, `paymentMethodName`, `data[]`, `totalIncome`, `grandTotal`, `excludedTicketsCount`.

**Evolución de incidentes por tipo** — respuesta JSON: `period`, `scope` (`enterpriseId`, `enterpriseName`; null = consolidado), `labels`, `datasets[]` con `type`, `typeLabel`, `data[]`, `total`, `grandTotal`. Tipos fijos: `mechanical`, `accident`, `delay`, `passenger`, `other`.

**Permisos en ms-security** (rol `BUSINESS_ADMIN` o `ADMIN`): registrar `GET` para las rutas anteriores (o patrón `/dashboard/*`).

## Paginación

Varios `GET` list usan `PaginationQueryDto` (`page`, `limit` en query).
