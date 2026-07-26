# Auth, OAuth y 2FA — ms-security

Documentación extendida: `docs/ROLES.md`, `docs/GITHUB_LOGIN_FRONTEND.md`.

## Login clásico

1. `POST /api/public/security/login` con `LoginDTO` (email, password, reCAPTCHA).
2. `SecurityService` busca usuario y verifica password con **BCrypt**.
3. Si OK → crea `AuthFactor` y envía código por email (`MS_NOTIFICATION_URL`).
4. Respuesta: `LoginChallengeDTO` (`challengeToken`, expiración). **No** JWT todavía.
5. `POST /api/public/security/verify-2fa` → JWT (`TokenDTO`).
6. Credenciales inválidas → **401**; fallo al enviar email 2FA → **503**.

## Registro

`POST /api/public/security/register` — `RegisterUserDTO`. Validar email único (`EntityAlreadyExists`).

## JWT

- Config: `jwt.secret`, `jwt.expiration` (default 3600000 ms = 1 h).
- Servicio: `JwtService` — creación y parseo; `getUserFromToken` en validate-token.

## Google

`POST /api/public/security/login/google` — token de Google; propiedades `google.oauth2.*` y Spring OAuth client registration.

## GitHub (frontend + API)

1. Frontend obtiene URL: `GET/POST .../github/authorize` o shortcut `login/github/authorize`.
2. Usuario autoriza en GitHub → callback `.../github/callback`.
3. Si usuario nuevo: `complete-registration`.
4. Vincular cuenta existente: `link/authorize`, `link`, `DELETE link`.

Redirect URI por defecto: `http://localhost:5173/auth/github/callback` (`github.oauth.redirect-uri`).

## 2FA

- `POST /api/public/security/verify-2fa` — valida código del `AuthFactor`.
- Longitud y expiración: `auth.factor.length`, `auth.factor.expiration`.

## Password recovery

1. `POST forgot-password` — dispara email vía `notifications.url`.
2. `POST reset-password` — token/código + nueva contraseña.

## Me (usuario actual)

`GET /api/public/security/me` — requiere `Authorization: Bearer`.

## Recaptcha

Propiedades `recaptcha.*` — usado en endpoints públicos sensibles (ver servicios que inyectan `RecaptchaProperties`).

## Integración ms-business

Solo **validar** tokens con `validate-token`; no reimplementar login en NestJS.

Roles devueltos deben alinearse con `@Roles()` en ms-business (ej. `DRIVER`).
