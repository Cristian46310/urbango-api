# Configuración Gmail OAuth — ms-notifications

## Requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- Proyecto en Google Cloud Console con Gmail API habilitada

## Pasos

### 1. Google Cloud Console

1. Crear o seleccionar proyecto.
2. Habilitar **Gmail API** (APIs & Services → Library).
3. Crear credenciales **OAuth 2.0 Client ID** tipo **Desktop**.
4. Descargar JSON → guardar en `ms-notifications/secrets/`.

### 2. Carpeta secrets

```bash
cd ms-notifications
mkdir -p secrets
# NO commitear secrets/ — debe estar en .gitignore
```

### 3. Archivo .env

```bash
cp .env.example .env
```

| Variable | Ejemplo |
|----------|---------|
| `SCOPES` | `https://www.googleapis.com/auth/gmail.send` |
| `SECRETS_LOCATION` | `./secrets` |
| `EMAIL` | cuenta remitente Gmail |
| `CLIENT_SECRET` | `./secrets/client_secret_xxxxx.json` |

### 4. Primera ejecución OAuth

Al primer envío, el servicio puede abrir flujo OAuth de escritorio para obtener/renovar token (según implementación en `email_service.py`).

## Errores frecuentes

| Error | Solución |
|-------|----------|
| `CLIENT_SECRET file not found` | Verificar ruta en `.env` y archivo en `secrets/` |
| `Gmail API not enabled` | Habilitar API en Cloud Console |
| `No module named 'app'` | Ejecutar desde raíz `ms-notifications/` con `uv run` |
| 403 / insufficient scope | Revisar `SCOPES` incluye `gmail.send` |

## Docker

En compose, secrets se montan en `/run/secrets`; ajustar `SECRETS_LOCATION` y `CLIENT_SECRET` para el path del contenedor.

## Seguridad

- No loguear tokens OAuth ni contenido de `client_secret_*.json`.
- No subir `secrets/` a git ni a imágenes públicas.
