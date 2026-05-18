# Patrones DTO — ms-business

## Estructura por dominio

```
dto/
├── base-<entity>.dto.ts      # Campos comunes con class-validator
├── create-<entity>.dto.ts    # Extiende o reutiliza base
├── update-<entity>.dto.ts    # PartialType(BaseDto)
├── response-<entity>.dto.ts  # Salida pública
└── response-<entity>-list.dto.ts  # { items, meta }
```

## Ejemplo stop (referencia)

- `base-stop.dto.ts` — `name`, `location` con validadores.
- `create-stop.dto.ts` — hereda base.
- `update-stop.dto.ts` — `PartialType(CreateStopDto)`.
- `response-stop.dto.ts` — campos expuestos al cliente.
- `response-stop-list.dto.ts` — paginación.

## route con relaciones

- `create-route-nodes.dto.ts` — ruta + arreglo opcional de nodos `{ stopId, order }`.
- `update-route-nodes.dto.ts` — actualización conjunta.
- El service valida órdenes únicos y FKs antes de persistir.

## Validación global

`main.ts` registra `ValidationPipe`:

- `whitelist: true` — elimina propiedades no decoradas.
- `forbidNonWhitelisted: true` — error si envían campos extra.
- `transform: true` — convierte tipos (query/body).

## Swagger

En controllers: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` en rutas protegidas.

Documento generado en `/docs` — título "MS Business API".

## Listas paginadas

`PaginationQueryDto` en `shared/dto/` — usar en `@Query()` de endpoints `GET` list.

Meta típica en response list DTOs: total, page, limit (según implementación del service).
