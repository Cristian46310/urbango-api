# Arquitectura del backend en NestJS

Este proyecto organiza el backend por dominio. En lugar de agrupar el código solo por tipo de archivo, cada entidad principal tiene su propio módulo con tres piezas clave:

- `controller`: expone los endpoints HTTP.
- `service`: concentra la lógica de negocio.
- `dto`: define la forma de entrada y salida de datos.

Los dominios `route`, `node` y `stop` muestran este patrón con claridad.

## Flujo general

1. El cliente llama a un endpoint del controller.
2. El controller recibe parámetros, cuerpo o query params y los delega al service.
3. El service valida datos, consulta repositorios y ejecuta la lógica de negocio.
4. El service devuelve un DTO de respuesta, no la entidad directamente.

Esto mantiene el controller delgado y hace que la lógica importante viva en un solo lugar.

## Route

`route` es el ejemplo más completo porque combina varias entidades.

### Controller

En [route.controller.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/route.controller.ts) el controller solo define la API:

- `POST /route` para crear una ruta.
- `GET /route` para listar rutas con paginación.
- `GET /route/:id` para obtener una ruta.
- `PATCH /route/:id` para actualizarla.
- `DELETE /route/:id` para eliminarla.

También usa Swagger con `@ApiTags`, `@ApiOperation` y respuestas tipadas para documentar la API.

### Service

En [route.service.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/route.service.ts) está la lógica real:

- crea la ruta primero;
- valida que los `stopId` existan;
- verifica que los `order` de los nodos no se repitan;
- crea los `node` asociados;
- recarga la ruta con sus relaciones para responder con datos completos.

Aquí se ve una regla importante de NestJS: el service orquesta repositorios y reglas de negocio, no el controller.

### DTOs

Los DTOs de `route` separan bien entrada y salida:

- [create-route.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/create-route.dto.ts) hereda la base de datos que necesita una ruta.
- [update-route.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/update-route.dto.ts) vuelve opcionales los campos para edición parcial.
- [create-route-nodes.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/create-route-nodes.dto.ts) agrega el arreglo opcional de nodos.
- [update-route-nodes.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/update-route-nodes.dto.ts) permite actualizar ruta y nodos en un mismo request.
- [response-route.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/response-route.dto.ts) define la forma pública de la respuesta.
- [response-route-list.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/response-route-list.dto.ts) envuelve listas con `items` y `meta`.

`route` no expone la entidad directamente. En su lugar transforma los datos para devolver solo lo necesario, ordenando los nodos por `order` y mostrando los `stops` dentro de la ruta.

## Node

`node` representa la relación entre una ruta y una parada.

### Controller

En [node.controller.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/node.controller.ts) el endpoint de creación usa parámetros de ruta:

- `POST /node/route/:routeId/stop/:stopId`

Eso muestra que NestJS permite combinar path params con body DTOs. El controller solo extrae valores y llama al service.

### Service

En [node.service.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/node.service.ts) el service:

- busca la `Route` por `routeId`;
- busca el `Stop` por `stopId`;
- crea el `Node` con `order`;
- devuelve una respuesta reducida con `order`, `routeId` y `stopId`.

Aquí el service protege la integridad de la relación entre entidades.

### DTOs

La estructura es simple y consistente:

- [base-node.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/dto/base-node.dto.ts) define `order` y `stopId`.
- [create-node.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/dto/create-node.dto.ts) conserva solo lo necesario para crear.
- [update-node.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/dto/update-node.dto.ts) hace parcial la entrada.
- [response-node.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/dto/response-node.dto.ts) define la respuesta pública.
- [response-node-list.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/dto/response-node-list.dto.ts) sigue el mismo patrón de paginación.

## Stop

`stop` es el dominio más simple y sirve como ejemplo del CRUD básico en NestJS.

### Controller

En [stop.controller.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/stop.controller.ts) se exponen endpoints estándar:

- `POST /stop`
- `GET /stop`
- `GET /stop/:id`
- `PATCH /stop/:id`
- `DELETE /stop/:id`

### Service

En [stop.service.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/stop.service.ts) la lógica es directa:

- crear una parada;
- listar con paginación;
- buscar por id;
- actualizar usando `preload`;
- eliminar verificando que exista.

### DTOs

La estructura también sigue el mismo patrón base:

- [base-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/base-stop.dto.ts) define `name` y `location`.
- [create-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/create-stop.dto.ts) reutiliza la base.
- [update-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/update-stop.dto.ts) vuelve opcionales los campos.
- [response-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/response-stop.dto.ts) define la salida pública.
- [response-stop-list.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/response-stop-list.dto.ts) encapsula la lista y la metadata.

## Idea clave

La arquitectura del proyecto sigue esta regla:

- el controller recibe y expone;
- el service decide y coordina;
- los DTOs delimitan lo que entra y lo que sale.

En `route`, además, el service muestra cómo combinar varias entidades relacionadas sin romper esa separación de responsabilidades.

## Paso a paso para crear endpoints en NestJS

Cuando vas a crear un endpoint nuevo en este proyecto, el flujo mental correcto es este:

1. Define la entidad del dominio.
2. Crea los DTOs de entrada.
3. Crea el DTO de respuesta.
4. Expón el endpoint en el controller.
5. Implementa la lógica en el service.
6. Valida relaciones y reglas de negocio en el service.
7. Devuelve siempre un formato controlado.

### 1. Define la entidad

Primero se modela la tabla o dominio en TypeORM. Por ejemplo:

- `Stop` representa una parada con `name`, `location` y `createdAt`.
- `Route` representa una ruta con `name`, `description`, `price` y sus `nodes`.
- `Node` representa la relación entre `Route` y `Stop`, con un `order`.

La entidad define qué existe en la base de datos y cómo se relaciona con otras entidades.

### 2. Crea los DTOs de entrada

Los DTOs sirven para controlar qué datos acepta el endpoint.

La estructura típica es:

- un DTO base con los campos comunes;
- un DTO de creación que reutiliza la base;
- un DTO de actualización que usa `PartialType`.

Ejemplos del proyecto:

- [base-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/base-stop.dto.ts)
- [create-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/create-stop.dto.ts)
- [update-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/update-stop.dto.ts)

En `node` pasa lo mismo con `order` y `stopId`, y en `route` se agrega un arreglo de nodos cuando hace falta crear la ruta con sus relaciones.

### 3. Crea el DTO de respuesta

No siempre conviene devolver la entidad completa. En este proyecto se prefieren DTOs de respuesta para exponer solo lo necesario.

Por ejemplo:

- [response-stop.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/stop/dto/response-stop.dto.ts) muestra los datos públicos de una parada.
- [response-node.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/node/dto/response-node.dto.ts) devuelve solo `order`, `stopId` y `routeId`.
- [response-route.dto.ts](/home/juan-manoel/Documents/ucaldas/semestre-6/backend/projects/final/dev-backend-uc/ms-business/src/route/dto/response-route.dto.ts) devuelve la ruta con sus `stops` ya transformados.

Esto protege la API y evita filtrar campos internos de la base de datos.

### 4. Expón el endpoint en el controller

El controller solo debe recibir la petición y delegarla al service.

Ejemplos del proyecto:

- `StopController` expone el CRUD clásico.
- `NodeController` usa un endpoint más específico: `POST /node/route/:routeId/stop/:stopId`.
- `RouteController` expone el CRUD de rutas y acepta nodos en el body cuando hace falta.

En esta capa se usan anotaciones como `@Post`, `@Get`, `@Patch`, `@Delete`, `@Param`, `@Body` y `@Query`.

### 5. Implementa la lógica en el service

Aquí vive el comportamiento real.

El service normalmente hace estas tareas:

- consultar repositorios;
- validar existencia de entidades;
- aplicar reglas de negocio;
- construir relaciones;
- transformar el resultado al DTO de respuesta.

Ejemplos concretos:

- `StopService` crea, lista, actualiza y elimina paradas.
- `NodeService` busca la ruta y la parada antes de crear el nodo.
- `RouteService` crea la ruta, valida los stops, comprueba órdenes únicos y luego guarda los nodos.

### 6. Valida relaciones y reglas de negocio

La diferencia entre un endpoint simple y uno robusto está en la validación.

En este proyecto se ven varias reglas importantes:

- no crear un nodo si no existe la ruta o la parada;
- no repetir el mismo `order` dentro de una ruta;
- no eliminar una parada si tiene nodos asociados;
- devolver error si la ruta o el stop no existen.

Esto evita inconsistencias en la base de datos y mantiene la integridad del dominio.

### 7. Devuelve siempre un formato controlado

La respuesta no debería depender de cómo TypeORM cargó la entidad, sino de lo que el servicio decide exponer.

Por eso el proyecto usa:

- `ResponseStopDto` para una parada individual;
- `ResponseNodeDto` para un nodo individual;
- `ResponseRouteDto` para una ruta con stops ordenados;
- `Response...ListDto` para listas con `items` y `meta`.

Este patrón hace que la API sea más predecible para el frontend.

## Cómo pensar un endpoint nuevo

Si mañana quieres crear un endpoint nuevo, piensa así:

- ¿qué entidad representa el dominio?
- ¿qué datos necesita recibir?
- ¿qué datos debe devolver?
- ¿hay relaciones con otras entidades?
- ¿qué reglas deben validarse antes de guardar?

Con esa secuencia, el diseño queda alineado con el patrón de `route`, `node` y `stop`.
