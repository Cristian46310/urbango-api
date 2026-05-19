# Arquitectura y estilo de código — ms-security

## Stack (frameworks y librerías)

| Tecnología | Uso en el proyecto |
|------------|-------------------|
| **Spring Boot 4.0.x** | Aplicación, auto-config, actuator |
| **Java 17** | Lenguaje |
| **Spring Data MongoDB** | Repositorios y documentos `@Document` |
| **springdoc-openapi 3** | Swagger UI + OpenAPI 3 |
| **Lombok** | Reducir boilerplate en modelos/DTOs |
| **Maven** (`./mvnw`) | Build y dependencias |
| **Azure Spring BOM** | Gestión de versiones (pom parent) |

No hay Spring Security Resource Server estándar con JWT en todos los endpoints: la seguridad se combina con `SecurityConfig` (matchers públicos) y lógica en services (`JwtService`, filtros/contexto según endpoint).

## Estructura de paquetes

```
com.jmmg.ms_security/
├── controllers/       # REST, ResponseEntity, validación @Valid
├── services/          # Reglas de negocio, orquestación
├── repositories/      # Interfaces MongoRepository
├── models/            # @Document — no exponer en API
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
3. **Repository** persiste o consulta MongoDB.
4. Respuesta como **DTO** o `ResponseEntity` con status HTTP.
5. Excepciones → `ErrorHandle` → `ErrorDTO` / `ErrorResponse`.

## Convenciones de código

- **API:** prefijos claros — `/api/public/security/*` (auth abierta), `/api/roles`, `/api/permissions` (admin RBAC).
- **Modelos vs DTOs:** documentos Mongo en `models/`; respuestas en `DTOs/`.
- **Passwords:** SHA256 en almacenamiento (`docs/ROLES.md`); no cambiar a bcrypt sin plan de migración.
- **Secretos:** `~/.config/ms-security/.env` vía `spring.config.import`; no commitear `.env` del repo.
- **Integraciones:** `notifications.url` → ms-notifications; contrato email alineado con `EmailDTO` Python.

## Prefijos API (resumen)

| Prefijo | Acceso |
|---------|--------|
| `/api/public/security` | Login, register, validate-token, OAuth |
| `/api/public/users` | Gestión usuarios |
| `/api/roles`, `/api/permissions`, `/api/profiles` | RBAC admin |

Catálogo: [api-catalog.md](api-catalog.md).
