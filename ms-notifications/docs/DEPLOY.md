# Despliegue de ms-notifications con Docker

Este microservicio requiere variables de entorno y una carpeta local de secretos con el archivo JSON de Google OAuth.

## Requisitos

- Docker instalado
- Docker Compose v2 instalado si vas a usar `docker compose`
- Carpeta `secrets/` creada dentro de `ms-notifications/`
- Archivo `.env` en `ms-notifications/`

## Variables de Entorno

Archivo `ms-notifications/.env` recomendado:

```bash
SCOPES=https://www.googleapis.com/auth/gmail.send
SECRETS_LOCATION=/run/secrets
EMAIL=tu-email@gmail.com
CLIENT_SECRET=client_secret_xxx.apps.googleusercontent.com.json
```

`CLIENT_SECRET` debe ser solo el nombre del archivo que está dentro de `secrets/`.

## Ejecutar con Docker Run

### Construir la imagen

```bash
docker build -t ms-notifications:prod -f ms-notifications/Dockerfile ms-notifications
```

### Ejecutar el contenedor

```bash
docker run -d --name ms-notifications-app \
	-p 8000:8000 \
	--env-file ms-notifications/.env \
	-v "$PWD/ms-notifications/secrets:/run/secrets:ro" \
	ms-notifications:prod
```

### Ver logs

```bash
docker logs -f ms-notifications-app
```

### Detener y eliminar

```bash
docker stop ms-notifications-app
docker rm ms-notifications-app
```

## Ejecutar con Docker Compose

Si usas el archivo raíz [docker-compose.yml](../../docker-compose.yml), puedes levantar solo este servicio:

```bash
docker compose up -d --build ms-notifications
```

O levantar todo el stack:

```bash
docker compose up -d --build
```

## Verificación

Servicio disponible en:

```text
http://localhost:8000
```

## Buenas Prácticas

- No copies `secrets/` dentro de la imagen.
- Mantén `secrets/` fuera de Git.
- Usa `.dockerignore` para evitar que Docker vea archivos locales innecesarios.
- Usa volumen de solo lectura para los secretos.

