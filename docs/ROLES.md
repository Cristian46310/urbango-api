# Sistema de Autenticación y Autorización - ms-security

## Índice

1. [Descripción General](#descripción-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [Flujo de Autenticación](#flujo-de-autenticación)
4. [Flujo de Autorización](#flujo-de-autorización)
5. [Componentes Principales](#componentes-principales)

---

## Descripción General

Este microservicio maneja la autenticación y autorización para el sistema UCaldas. El flujo es:

1. **Autenticación**: Validar que el usuario es quien dice ser (login con email/password)
2. **Generación de Token JWT**: Crear un token seguro que contiene la identidad del usuario
3. **Autorización**: Validar que el usuario tiene los roles necesarios para acceder a los recursos

---

## Modelos de Datos

### 1. **User** (Usuario)

```
- id: String (MongoDB ID)
- name: String (nombre del usuario)
- email: String (identificador único, con índice)
- password: String (contraseña encriptada en SHA256)
```

**Propósito**: Almacena la información básica del usuario.

### 2. **Role** (Rol)

```
- id: String (MongoDB ID)
- name: String (nombre único: "ADMIN", "USER", "MODERATOR", etc.)
- description: String (descripción del rol)
```

**Propósito**: Define qué permisos o responsabilidades tiene un grupo de usuarios.

### 3. **UserRole** (Relación Usuario-Rol)

```
- id: String (MongoDB ID)
- userId: Reference a User (mediante @DBRef)
- roleId: Reference a Role (mediante @DBRef)
```

**Propósito**: Establece una relación muchos-a-muchos entre usuarios y roles.
Un usuario puede tener múltiples roles, y un rol puede ser asignado a múltiples usuarios.

**Índices para optimización**:

- `user_role_unique_idx`: Garantiza que un usuario no tenga el mismo rol asignado dos veces
- `user_idx`: Permite búsquedas rápidas por usuario
- `role_idx`: Permite búsquedas rápidas por rol

---

## Flujo de Autenticación

### Paso 1: Login (POST /security/login)

```
Entrada: LoginDTO { email, password }
           ↓
SecurityController.login()
           ↓
SecurityService.login(User)
           ↓
1. Buscar usuario por email en la BD
           ↓
2. Comparar passwords:
   - Password ingresado → Convertir a SHA256
   - Password en BD → Ya está en SHA256
   - ¿Son iguales?
           ↓ Sí
3. Generar JWT con JwtService.generateToken()
           ↓
Salida: TokenDTO { token }
```

### Paso 2: Generación de JWT

El token contiene:

- **Payload (claims)**:
  - `id`: ID del usuario
  - `name`: Nombre del usuario
  - `email`: Email del usuario
  - `sub` (subject): ID del usuario
  - `iat` (issued at): Fecha/hora de generación
  - `exp` (expiration): Fecha/hora de expiración

- **Firma**: Se usa una clave secreta (SHA-512) para firmar el token

**Ventaja**: El token es autoverificable y seguro. No necesita consultar BD cada vez.

---

## Flujo de Autorización

### Paso 1: Validación del Token en cada Solicitud

```
Cliente envía: GET /users/123
Header: Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
           ↓
SecurityFilter.doFilterInternal()
           ↓
1. Extraer token del header "Authorization"
2. Validar firma y expiración del token
3. Extraer información del usuario del token
4. Cargar detalles completos del usuario (email)
5. Obtener los ROLES del usuario
           ↓
SecurityContext.setAuthentication()
           ↓
Solicitud procede con contexto de seguridad
```

### Paso 2: Carga de Roles del Usuario

En `CustomUserDetailsService.loadUserByUsername(email)`:

```
1. Buscar usuario por email
           ↓
2. Obtener lista de UserRole del usuario
           ↓
3. Extraer IDs de los roles asociados
           ↓
4. Obtener detalles completos de los roles
           ↓
5. Convertir nombres de roles a GrantedAuthority
   Ejemplo: "ADMIN" → "ROLE_ADMIN"
           ↓
6. Crear UserDetails con los roles como autoridades
```

### Paso 3: Control de Acceso

```
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(String id) { ... }
           ↓
Spring Security comprueba si
SecurityContext.getAuthentication().getAuthorities()
contiene "ROLE_ADMIN"
           ↓
¿Tiene permiso? Sí → Ejecuta el método
                No → Lanza AccessDeniedException
```

---

## Componentes Principales

### 1. **EncryptionService**

- Convierte passwords a SHA256
- Usado en `UserService.save()` para encriptar password
- `SecurityService.login()` usa esto para validar

### 2. **JwtService**

- Genera tokens JWT con información del usuario
- Valida la firma y expiración del token
- Extrae información del usuario del token

### 3. **CustomUserDetailsService**

- Implementa `UserDetailsService` de Spring Security
- Carga los detalles del usuario y sus roles
- **PROBLEMA CRÍTICO**: Está obteniendo IDs incorrectos

### 4. **SecurityConfiguration**

- Configura las reglas de seguridad HTTP
- Define qué endpoints son públicos (`/security/login`)
- Configura CORS y CSRF
- Usa sesiones STATELESS (sin cookies)

### 5. **SecurityFilter**

- Filtra cada solicitud HTTP
- Valida el JWT y establece el contexto de seguridad
- Ejecuta antes que otros filtros

---

## Flujo Completo de un Login

```
1. Usuario hace POST /security/login
   { "email": "juan@example.com", "password": "123456" }

2. SecurityController.login() recibe la solicitud

3. SecurityService.login() ejecuta:
   ✓ Busca usuario por email
   ✓ Encripta password ingresado a SHA256
   ✓ Compara con password en BD
   ✓ Si es correcto, genera JWT

4. JwtService.generateToken():
   ✓ Crea claims con id, name, email
   ✓ Firma con secret key (HS512)
   ✓ Retorna token: "eyJhbGciOiJIUzUxMiJ9..."

5. Cliente guarda el JWT

6. Cliente hace GET /users/123
   Header: Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...

7. SecurityFilter.doFilterInternal() ejecuta:
   ✓ Extrae token del header
   ✓ Valida firma y expiración
   ✓ Extrae datos del usuario del token
   ✓ Carga usuario de la BD
   ✓ Carga roles del usuario (⚠️ AQUÍ EL BUG)
   ✓ Crea UserDetails con GrantedAuthority
   ✓ Establece contexto de seguridad

8. El controlador puede usar:
   @PreAuthorize("hasRole('ADMIN')") ← ⚠️ NO FUNCIONA
   SecurityContextHolder.getContext().getAuthentication()

9. Si todo es correcto, procede con la solicitud
```

---

## Configuración Requerida (application.properties)

```properties
jwt.secret=tu-clave-secreta-super-segura-minimo-256-bits
jwt.expiration=86400000
```

---

## Referencias Útiles

- **JWT**: JSON Web Tokens - tokens autoverificables
- **Spring Security**: Framework para autenticación y autorización
- **MongoDB @DBRef**: Referencias entre documentos
