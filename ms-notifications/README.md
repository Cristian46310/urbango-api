# MS Notifications

Microservicio de notificaciones para el sistema de la Universidad de Caldas. Permite enviar notificaciones por correo electrónico y mensajes de texto.

## Requisitos Previos

- **Python 3.12+** - [Descargar](https://www.python.org/downloads/)
- **uv** - Gestor de paquetes de Python rápido. [Instalación](https://docs.astral.sh/uv/getting-started/installation/)

### Verificar Instalación

```bash
python --version
uv --version
```

## Instalación de Dependencias

### Usando uv (Recomendado)

```bash
# Instalar todas las dependencias
uv sync
```

El comando `uv sync`:

- Lee el archivo `pyproject.toml` y `uv.lock`
- Instala las dependencias exactas especificadas
- Crea un entorno virtual automáticamente (`.venv`)

## Configuración

### 1. Archivo `.env`

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
cp .env.example .env
```

Luego editar `.env` y configurar:

```env
# Scopes de autorización de Google (separados por ';')
SCOPES=https://www.googleapis.com/auth/gmail.send

# Ubicación de los archivos de secretos (ruta relativa o absoluta)
SECRETS_LOCATION=./secrets

# Correo electrónico del servicio
EMAIL=tu-email@gmail.com

# Ruta al archivo de credenciales de Google
CLIENT_SECRET=./secrets/client_secret_xxxxx.apps.googleusercontent.com.json
```

### 2. Carpeta `secrets/`

Crear la carpeta `secrets/` en la raíz del proyecto:

```bash
mkdir -p secrets
```

Dentro de esta carpeta, colocar:

- `client_secret_*.json` - Archivo de credenciales de Google OAuth 2.0
  - Obtener desde [Google Cloud Console](https://console.cloud.google.com/)
  - Crear aplicación OAuth 2.0 (Desktop)
  - Descargar el archivo JSON y renombrarlo según sea necesario

**Estructura esperada:**

```
ms-notifications/
├── secrets/
│   └── client_secret_118026236408-usjnvc27g9iejvlne9lgo0trju2k9kkf.apps.googleusercontent.com.json
├── app/
├── .env
├── .env.example
├── pyproject.toml
└── README.md
```

> **Nota:** La carpeta `secrets/` no debe ser incluida en el control de versiones (git). Asegúrate de que esté en `.gitignore`.

## Ejecutar el Proyecto

### Usando uv

```bash
# Ejecutar directamente con uv
uv run fastapi dev

# Con más opciones
uv run fastapi dev --host 0.0.0.0 --port 8000
```

## Estructura del Proyecto

```
app/
├── __init__.py
├── DTOs/                      # Data Transfer Objects
│   ├── __init__.py
│   ├── email_dto.py           # Modelo para recibir solicitudes de email
│   └── email_response_dto.py  # Modelo de respuesta
├── routes/                    # Endpoints de la API
│   ├── __init__.py
│   └── email.py               # Rutas para enviar emails
└── services/                  # Lógica de negocio
    ├── __init__.py
    └── email_service.py       # Servicio de envío de emails
```

## Dependencias Principales

| Paquete                    | Versión   | Descripción                     |
| -------------------------- | --------- | ------------------------------- |
| `fastapi`                  | >=0.135.2 | Framework web moderno para APIs |
| `google-api-python-client` | >=2.193.0 | Cliente de Google APIs          |
| `google-auth-httplib2`     | >=0.3.0   | Autenticación para Google APIs  |
| `google-auth-oauthlib`     | >=1.3.0   | OAuth 2.0 para Google           |
| `python-dotenv`            | >=1.2.2   | Gestor de variables de entorno  |
| `telethon`                 | >=1.42.0  | Cliente de Telegram             |

## Uso de la API

### Enviar Email

```bash
curl -X POST "http://localhost:8000/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "usuario@example.com",
    "subject": "Asunto del correo",
    "body": "Cuerpo del mensaje"
  }'
```

## Desarrollo

### Modo de recarga automática

```bash
uv run fastapi run app --reload
```

La aplicación se reiniciará automáticamente cuando detecte cambios en los archivos.

## Solución de Problemas

### Error: "No module named 'app'"

Asegúrate de:

1. Ejecutar el comando desde la raíz del proyecto (`ms-notifications/`)
2. Haber instalado las dependencias con `uv sync`

### Error: "CLIENT_SECRET file not found"

Verifica:

1. La carpeta `secrets/` existe
2. El archivo `.json` de credenciales está en la carpeta correcta
3. La variable `CLIENT_SECRET` en `.env` apunta al archivo correcto

### Error: "Gmail API not enabled"

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Buscar "Gmail API"
3. Hacer clic en "Habilitar"

## Variables de Entorno

| Variable           | Obligatoria | Descripción                                                           |
| ------------------ | ----------- | --------------------------------------------------------------------- |
| `SCOPES`           | Sí          | Permisos de Google (ej: `https://www.googleapis.com/auth/gmail.send`) |
| `SECRETS_LOCATION` | Sí          | Ruta a la carpeta con las credenciales                                |
| `EMAIL`            | Sí          | Correo electrónico del servicio                                       |
| `CLIENT_SECRET`    | Sí          | Ruta al archivo `client_secret_*.json`                                |

## Documentación API

Una vez que el servidor está corriendo, accede a:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Licencia

MIT

## Contacto

Para preguntas o problemas, contactar al equipo de desarrollo.
