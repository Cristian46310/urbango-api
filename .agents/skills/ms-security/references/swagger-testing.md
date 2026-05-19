# Probar la API con Swagger — ms-security

## URLs

| Recurso | URL local (springdoc OpenAPI 3) |
|---------|----------------------------------|
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |

Rutas permitidas sin autenticación HTTP en `SecurityConfig` y `WebConfig`: `/swagger-ui/**`, `/v3/api-docs/**`, `/api/docs/**`.

Bean OpenAPI: `infra/springdoc/SpringDocConfiguration.java` — esquema **`bearer-jwt`**.

## Arrancar el servicio

```bash
cd ms-security
# Secretos en ~/.config/ms-security/.env (ver references/env-vars.md)
./mvnw spring-boot:run
```

MongoDB debe estar disponible según `application.properties`.

## Autorizar peticiones

1. En Swagger UI, ejecuta **`POST /api/public/security/login`** con email/password.
2. Copia el `token` de la respuesta.
3. Clic en **Authorize** → esquema **bearer-jwt** → pega el JWT (sin prefijo `Bearer` si la UI lo añade sola).
4. Prueba endpoints que requieran cabecera `Authorization: Bearer <token>`.

## Endpoints útiles para integración

| Endpoint | Uso |
|----------|-----|
| `POST /api/public/security/login` | Obtener JWT |
| `POST /api/public/security/register` | Alta usuario |
| `POST /api/public/security/validate-token` | Lo consume ms-business (no duplicar lógica JWT en Nest) |
| OAuth shortcuts | `/api/public/security/github`, `/microsoft`, etc. |

## Anotaciones en controllers

Usar anotaciones OpenAPI 3 (`io.swagger.v3.oas.annotations.*`) donde haga falta documentar operaciones, parámetros y respuestas. Los DTOs en `DTOs/` son el contrato visible en Swagger.

## Checklist rápido

- [ ] Servicio en `8080`, health `GET /actuator/health`
- [ ] Swagger UI carga
- [ ] Login devuelve `token`
- [ ] **Authorize** con JWT y endpoints protegidos responden 200
