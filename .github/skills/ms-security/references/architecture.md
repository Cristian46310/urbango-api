# Arquitectura y estilo de código — ms-security

## Stack (frameworks y librerías)

| Tecnología | Uso en el proyecto |
|------------|-------------------|
| **Spring Boot 4.0.x** | Aplicación, auto-config |
| **Java 17** | Lenguaje |
| **Spring Data JPA** | Entidades `@Entity` + `JpaRepository` |
| **PostgreSQL** | Schema `security` (Supabase) |
| **springdoc-openapi 3** | Swagger UI + OpenAPI 3 |
| **Lombok** | Reducir boilerplate en modelos/DTOs |
| **Maven** (`./mvnw`) | Build y dependencias |

La seguridad combina `SecurityConfig` (matchers públicos), `JwtAuthenticationFilter` y `SecurityInterceptor` (RBAC en BD).

## Estructura de paquetes

```
com.jmmg.ms_security/
├── controllers/       # REST, ResponseEntity, validación @Valid
├── services/          # Reglas de negocio, orquestación
├── repositories/      # Interfaces JpaRepository
├── models/            # @Entity — no exponer en API
├── DTOs/              # Contratos por dominio (login, user, Role…)
├── infra/
│   ├── config/        # JwtProperties, EmailProperties, OAuth…
│   ├── errors/        # ErrorHandle (@ControllerAdvice)
│   ├── exception/     # Excepciones de dominio
│   └── springdoc/     # OpenAPI bearer-jwt
└── configurations/    # WebConfig, SecurityConfig, CORS
```

Detalle de servicios: [layers-and-packages.md](layers-and-packages.md).

## Flujo de una petición

1. **Controller** recibe DTO + headers (`Authorization` cuando aplica).
2. **Service** valida, usa `JwtService` / `SecurityService` / OAuth services.
3. **Repository** persiste o consulta PostgreSQL.
4. Respuesta como **DTO** o `ResponseEntity` con status HTTP.
5. Excepciones → `ErrorHandle` → `ErrorDTO`.

## Convenciones de código

- **API:** prefijos claros — `/api/public/security/*` (auth abierta), `/api/roles`, `/api/permissions` (admin RBAC).
- **Modelos vs DTOs:** entidades JPA en `models/`; respuestas en `DTOs/`.
- **Passwords:** BCrypt (`EncryptionService`).
- **Secretos:** `ms-security/.env` vía `spring.config.import`; no commitear `.env`.
- **Integraciones:** `notifications.url` → ms-notifications.

## Prefijos API (resumen)

| Prefijo | Acceso |
|---------|--------|
| `/api/public/security` | Login, register, validate-token, OAuth |
| `/api/users` | Gestión usuarios |
| `/api/roles`, `/api/permissions`, `/api/user-role` | RBAC admin |
| `/api/health` | Health check |

Catálogo: [api-catalog.md](api-catalog.md).
