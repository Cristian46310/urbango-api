# Login con GitHub desde el Frontend

Este documento explica el flujo recomendado para autenticar usuarios con GitHub usando el frontend y el microservicio `ms-security`.

## Objetivo

El backend maneja toda la lógica interna de GitHub OAuth:

- generar el `state`
- redirigir a GitHub
- intercambiar `code` por token de GitHub
- leer perfil y email
- crear o vincular la cuenta local
- emitir el JWT de la aplicación

El frontend solo inicia el flujo, recibe la respuesta y decide qué mostrar.

## Endpoints disponibles

### Iniciar login con GitHub

Usa uno de estos endpoints para obtener la URL de autorización de GitHub:

- `POST /api/public/security/login/github/authorize`
- `GET /api/public/security/github/authorize`

Respuesta esperada:

```json
{
  "authorizationUrl": "https://github.com/login/oauth/authorize?..."
}
```

### Completar el callback

GitHub devuelve `code` y `state`. Luego el frontend o el backend pueden enviar esos valores a:

- `POST /api/public/security/login/github`
- `POST /api/public/security/github/callback`
- `GET /api/public/security/github/callback?code=...&state=...`

La respuesta incluye el estado final de autenticación.

### Completar registro cuando GitHub no entrega email público

Si GitHub no expone un email verificable, el backend responde con `EMAIL_REQUIRED` y un `registrationToken`.

Luego el frontend debe llamar:

- `POST /api/public/security/login/github/complete`
- `POST /api/public/security/github/complete-registration`

Body esperado:

```json
{
  "registrationToken": "...",
  "email": "usuario@correo.com"
}
```

### Desvincular cuenta

Si el usuario ya está autenticado en la app, puede desvincular GitHub con:

- `DELETE /api/public/security/github/link`

## Flujo recomendado para frontend

### Opción 1: flujo simple con redirección completa

Esta es la opción más directa.

1. El frontend llama `POST /api/public/security/login/github/authorize`.
2. El backend responde con `authorizationUrl`.
3. El frontend redirige la ventana actual a esa URL.
4. GitHub autentica al usuario.
5. GitHub devuelve `code` y `state` al `redirect_uri` configurado en el backend.
6. El backend procesa el callback y devuelve JSON con el resultado.

Este flujo funciona bien, pero si el `redirect_uri` apunta al backend, la navegación final termina mostrando la respuesta JSON del backend en lugar de volver al frontend.

### Opción 2: flujo SPA recomendado

Si quieres que la experiencia se quede dentro del frontend, configura `GITHUB_REDIRECT_URI` para apuntar a una ruta del frontend, por ejemplo:

```bash
GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback
```

Luego:

1. El frontend llama `POST /api/public/security/login/github/authorize`.
2. El backend devuelve `authorizationUrl` con el `state` interno.
3. El frontend redirige al usuario a GitHub.
4. GitHub vuelve al frontend en `/auth/github/callback?code=...&state=...`.
5. El frontend toma `code` y `state` de la URL.
6. El frontend envía esos valores al backend con `POST /api/public/security/login/github`.
7. El backend devuelve el JWT y los datos del usuario.

Esta opción es la más limpia para una SPA.

## Qué devuelve el backend

Cuando la autenticación termina correctamente, la respuesta incluye:

- `status`
- `message`
- `token`
- `idToken` como alias del mismo JWT
- `registrationToken` cuando aplica
- `linked`
- `created`
- `user`

## Casos de respuesta

### Login exitoso

```json
{
  "status": "AUTHENTICATED",
  "message": "GitHub account authenticated successfully.",
  "token": "jwt-de-la-app",
  "idToken": "jwt-de-la-app",
  "registrationToken": null,
  "linked": true,
  "created": false,
  "user": { }
}
```

### Usuario nuevo creado por GitHub

```json
{
  "status": "AUTHENTICATED",
  "message": "User created and authenticated with GitHub.",
  "token": "jwt-de-la-app",
  "idToken": "jwt-de-la-app",
  "registrationToken": null,
  "linked": true,
  "created": true,
  "user": { }
}
```

### Falta email público en GitHub

```json
{
  "status": "EMAIL_REQUIRED",
  "message": "GitHub account does not expose a public email. Please provide an alternate email.",
  "token": null,
  "idToken": null,
  "registrationToken": "state-o-token-temporal",
  "linked": false,
  "created": false,
  "user": null
}
```

En ese caso, el frontend debe pedir un correo alternativo y luego llamar al endpoint de completado de registro.

## Ejemplo de integración en frontend

### 1. Pedir la URL de GitHub

```ts
const response = await fetch("http://localhost:8080/api/public/security/login/github/authorize", {
  method: "POST",
});
const data = await response.json();
window.location.href = data.authorizationUrl;
```

### 2. Procesar el callback en la SPA

Si usas `GITHUB_REDIRECT_URI` apuntando al frontend:

```ts
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const state = params.get("state");

const response = await fetch("http://localhost:8080/api/public/security/login/github", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ code, state }),
});

const result = await response.json();
```

### 3. Guardar el token

Si `result.status === "AUTHENTICATED"`, guarda `result.idToken` o `result.token` en el storage de autenticación de tu frontend.

## Notas importantes

- `authorize` genera un `state` interno y el backend lo valida en el callback.
- No debes construir manualmente el token de GitHub desde el frontend.
- El frontend solo maneja `authorizationUrl`, `code`, `state` y la respuesta final del backend.
- Si quieres un flujo 100% SPA, cambia `GITHUB_REDIRECT_URI` para que apunte al frontend.

## Resumen corto

1. Pides `authorizationUrl` al backend.
2. Rediriges al usuario a GitHub.
3. GitHub retorna `code` y `state`.
4. Envías `code` y `state` al backend.
5. El backend crea o vincula la cuenta y devuelve el JWT.
