# Variables de entorno — ms-notifications

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `SCOPES` | Sí | Permisos Gmail, separados por `;` si varios |
| `SECRETS_LOCATION` | Sí | Directorio de credenciales OAuth |
| `EMAIL` | Sí | Cuenta remitente del servicio |
| `CLIENT_SECRET` | Sí | Ruta al `client_secret_*.json` |

## Ejemplo (.env.example)

```env
SCOPES=https://www.googleapis.com/auth/gmail.send
SECRETS_LOCATION=./secrets
EMAIL=tu-email@gmail.com
CLIENT_SECRET=./secrets/client_secret_xxxxx.apps.googleusercontent.com.json
```

## Docker / Compose

- `PORT` — puerto interno (8000 en compose).
- Secrets volumen: `./ms-notifications/secrets:/run/secrets:ro`
- Ajustar paths si el contenedor usa `/run/secrets/...`

## Dependencias (pyproject.toml)

- `fastapi`, `uvicorn`
- `google-api-python-client`, `google-auth-oauthlib`, `google-auth-httplib2`
- `python-dotenv`
- `telethon` — presente en proyecto; verificar uso antes de asumir en features email
