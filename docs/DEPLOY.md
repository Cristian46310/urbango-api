# Guía de Despliegue con Docker y Docker Compose

Este documento cubre la forma recomendada de ejecutar el proyecto completo en producción o en desarrollo local usando Docker.

## Requisitos Previos

- Docker instalado
- Docker Compose v2 instalado
- Un archivo `.env` para cada servicio
- La carpeta `ms-notifications/secrets/` con el JSON de Google OAuth

Verifica la instalación:

```bash
docker --version
docker compose version
```

## Estructura Esperada

```text
dev-backend-uc/
├── docker-compose.yml
├── ms-security/
│   └── DockerFile
└── ms-notifications/
    ├── Dockerfile
    ├── .env
    └── secrets/
        └── client_secret_xxx.json
```

## Variables de Entorno

### ms-security

Crear un `.env` en la raíz del repositorio (o `ms-security/.env`) según `.env.example`:

```bash
DB_URL=jdbc:postgresql://.../postgres?currentSchema=security&sslmode=require&prepareThreshold=0
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<db-password>
JWT_SECRET=<secreto_min_32_chars>
MS_SECURITY_INTERNAL_KEY=<clave_interna>
MS_NOTIFICATION_URL=http://ms-notifications:8000/api/email/send
CORS_ALLOWED_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Health: `GET /api/health` (no actuator).

### ms-notifications

Crear `ms-notifications/.env` con estas variables:

```bash
SCOPES=https://www.googleapis.com/auth/gmail.send
SECRETS_LOCATION=/run/secrets
EMAIL=tu-email@gmail.com
CLIENT_SECRET=client_secret_xxx.apps.googleusercontent.com.json
```

Importante: `CLIENT_SECRET` debe ser solo el nombre del archivo, no una ruta completa.

## Ejecutar con Docker Run

### ms-security

```bash
docker build -t ms-security:prod -f ms-security/DockerFile ms-security
docker run -d --name ms-security-app \
  -p 8080:8080 \
  --env-file .env \
  ms-security:prod
```

### ms-notifications

```bash
docker build -t ms-notifications:prod -f ms-notifications/Dockerfile ms-notifications
docker run -d --name ms-notifications-app \
  -p 8000:8000 \
  --env-file ms-notifications/.env \
  -v "$PWD/ms-notifications/secrets:/run/secrets:ro" \
  ms-notifications:prod
```

## Ejecutar con Docker Compose

El archivo de Compose está en la raíz del repositorio: [docker-compose.yml](../docker-compose.yml).

### Levantar todos los servicios

```bash
docker compose up -d --build
```

### Levantar solo un servicio

```bash
docker compose up -d --build ms-security
docker compose up -d --build ms-notifications
```

### Detener los servicios

```bash
docker compose down
```

### Detener y borrar volúmenes

```bash
docker compose down -v
```

## Puertos

- ms-security: `http://localhost:8080`
- ms-notifications: `http://localhost:8000`

## Logs

```bash
docker compose logs -f ms-security
docker compose logs -f ms-notifications
```

## Notas de Producción

- No copies la carpeta `secrets/` dentro de la imagen.
- Usa `.dockerignore` para excluir secretos y artefactos locales.
- Mantén las credenciales de Google montadas como volumen de solo lectura.
- Si cambias el archivo JSON, reinicia el contenedor.

## Solución de Problemas

### ms-notifications no encuentra el archivo JSON

Revisa que estas tres cosas coincidan:

1. El volumen monta `ms-notifications/secrets` en `/run/secrets`
2. `SECRETS_LOCATION=/run/secrets`
3. `CLIENT_SECRET` contiene solo el nombre del archivo JSON

### Puerto ocupado

Si el puerto 8000 o 8080 ya está ocupado, cambia el mapeo en `docker-compose.yml` o usa otro puerto en `docker run`.

## Actualizar la Aplicación

```bash
docker compose up -d --build
```
