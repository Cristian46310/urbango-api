# Variables de entorno — ms-security

## Ubicación del archivo

Producción/desarrollo local recomendado:

```
~/.config/ms-security/.env
```

También soportado (opcional): `.env` en raíz del repo o `ms-security/.env` vía `spring.config.import`.

## MongoDB

| Variable | Property |
|----------|----------|
| `MONGO_URI` | `spring.mongodb.uri` |
| `MONGO_DATABASE` | `spring.mongodb.database` |

## JWT

| Variable | Property |
|----------|----------|
| `JWT_SECRET` | `jwt.secret` |

## Notificaciones

| Variable | Property |
|----------|----------|
| `MS_NOTIFICATION_URL` | `notifications.url` |

Ejemplo: `http://127.0.0.1:8000/api/email/send`

## Google OAuth

| Variable |
|----------|
| `GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` |
| `GOOGLE_SCOPE` (default openid,profile,email) |

## GitHub OAuth

| Variable | Default en properties |
|----------|----------------------|
| `GITHUB_CLIENT_ID` | — |
| `GITHUB_CLIENT_SECRET` | — |
| `GITHUB_REDIRECT_URI` | `http://localhost:5173/auth/github/callback` |

## Microsoft OAuth

| Variable |
|----------|
| `MICROSOFT_CLIENT_ID` |
| `MICROSOFT_SECRET_KEY` |
| `MICROSOFT_TENANT_ID` |
| `MICROSOFT_REDIRECT_URI` |
| `MICROSOFT_AUTHORIZE_URI`, `MICROSOFT_TOKEN_URI`, etc. |

## Recaptcha

| Variable |
|----------|
| `RECAPTCHA_SITE_KEY` |
| `RECAPTCHA_SECRET_KEY` |

## Servidor

| Variable | Notas |
|----------|-------|
| `SERVER_PORT` | Docker compose; default 8080 |

Ver plantilla completa: `ms-security/.env.example`.
