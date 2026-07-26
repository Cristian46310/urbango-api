# Probar la API con Swagger — ms-security

## URLs

| Recurso | URL local (springdoc OpenAPI 3) |
|---------|----------------------------------|
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |
| Health | `http://localhost:8080/api/health` |

Rutas permitidas sin autenticación HTTP en `SecurityConfig` y `WebConfig`: `/swagger-ui/**`, `/v3/api-docs/**`, `/api/docs/**`, `/api/health`.

Bean OpenAPI: `infra/springdoc/SpringDocConfiguration.java` — esquema **`bearer-jwt`**.

## Arrancar el servicio

```bash
cd ms-security
# Secretos en ms-security/.env (ver .env.example / SETUP-LOCAL.md)
./mvnw spring-boot:run
```

PostgreSQL (schema `security`) debe estar disponible vía `DB_URL`.

## Autorizar peticiones

1. En Swagger UI, ejecuta **`POST /api/public/security/login`** (email/password + reCAPTCHA).
2. Completa **`POST /api/public/security/verify-2fa`** con el código del email → copia el `token`.
3. Clic en **Authorize** → esquema **bearer-jwt** → pega el JWT.
4. Prueba endpoints que requieran `Authorization: Bearer <token>`.

## Endpoints útiles para integración

| Endpoint | Uso |
|----------|-----|
| `POST /api/public/security/login` | Challenge 2FA |
| `POST /api/public/security/verify-2fa` | Obtener JWT |
| `POST /api/public/security/register` | Alta usuario |
| `POST /api/public/security/validate-token` | Lo consume ms-business |
| OAuth | Google / GitHub |

## Checklist rápido

- [ ] Servicio en `8080`, health `GET /api/health`
- [ ] Swagger UI carga
- [ ] Login → verify-2fa → JWT
- [ ] **Authorize** con JWT y endpoints protegidos responden 200
