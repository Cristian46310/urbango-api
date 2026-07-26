# Capas y paquetes — ms-security

```
src/main/java/com/jmmg/ms_security/
├── MsSecurityApplication.java
├── controllers/          # 10 REST controllers
├── services/             # JwtService, SecurityService, *OAuthService, UserService…
├── repositories/         # IUserRepository, IRoleRepository, …
├── models/               # Entidades JPA (@Entity)
├── DTOs/
│   ├── login/
│   ├── user/
│   ├── Role/
│   ├── permission/
│   ├── errors/
│   └── …
├── infra/
│   ├── config/           # JwtProperties, EmailProperties, *OAuthProperties
│   ├── errors/           # ErrorHandle (@ControllerAdvice)
│   └── exception/        # DataNotFound, EntityAlreadyExists, InvalidCredentials…
└── configurations/       # WebConfig, SecurityConfig
```

## Flujo de una petición

1. Controller recibe DTO + headers.
2. Service aplica reglas y accede a repositories.
3. Repository persiste/consulta PostgreSQL.
4. Controller devuelve DTO o `ResponseEntity` con status HTTP.
5. Excepciones → `ErrorHandle` → `ErrorDTO`.

## Servicios clave

| Servicio | Responsabilidad |
|----------|-----------------|
| `SecurityService` | Login, register, password |
| `JwtService` | Tokens JWT |
| `UserService` | CRUD usuario, detalle con roles |
| `UserRoleService` | Asignación roles |
| `RolePermissionService` | Permisos por rol |
| `GitHubOAuthService` | OAuth GitHub |
| `AuthFactorService` | 2FA |
| `ValidatorService` | Validaciones compartidas |
| `AuthenticatedUserService` | Contexto usuario en request |

## Tests

`src/test/java/.../MsSecurityApplicationTests.java` — context load.

Verificación rápida (agentes): `scripts/build.sh` → `mvn clean package -DskipTests`.  
CI (GitHub): `./mvnw -B clean verify`.

## Dependencias notables (pom.xml)

- Spring Boot 4, spring-boot-starter-data-mongodb
- springdoc-openapi
- Lombok
- Azure Spring (dependency management 7.1.0)
