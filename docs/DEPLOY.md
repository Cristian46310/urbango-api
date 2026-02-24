# Guía de Despliegue con Docker Compose

Este documento proporciona instrucciones detalladas sobre cómo utilizar Docker Compose para desplegar el microservicio `ms-security`.

## 📋 Requisitos Previos

- Docker instalado (versión 20.10+)
- Docker Compose instalado (versión 2.0+)
- Git para clonar/trabajar con el repositorio
- Acceso a MongoDB Atlas (credenciales configuradas)

Verifica la instalación:
```bash
docker --version
docker compose version
```

---

## 🚀 Iniciar el Servicio

### Opción 1: Variables de Entorno Predeterminadas

Para iniciar el servicio con las configuraciones predeterminadas:

```bash
docker compose up -d
```

**Flags útiles:**
- `-d`: Ejecutar en modo desapegado (background)
- `--build`: Reconstruir las imágenes antes de iniciar
- `--scale ms-security=3`: Escalar el servicio a N instancias

### Opción 2: Especificar Variables de Entorno

Si quieres sobrescribir las variables de entorno (como el secreto JWT):

```bash
docker compose up -d \
  -e JWT_SECRET="tu-secreto-seguro" \
  -e JWT_EXPIRATION="7200000"
```

O crear un archivo `.env` en la raíz del proyecto:

```bash
# .env
JWT_SECRET=tu-secreto-seguro-aqui
JWT_EXPIRATION=7200000
```

Luego ejecutar:
```bash
docker compose up -d
```

---

## 📦 Construir la Imagen

Para reconstruir la imagen Docker (útil después de cambios en el código):

```bash
docker compose build --no-cache
```

---

## 🛑 Detener el Servicio

```bash
# Detener los contenedores pero mantener los datos
docker compose stop

# Detener y remover los contenedores
docker compose down

# Detener y remover contenedores + volúmenes
docker compose down -v
```

---

## 📊 Monitorear el Servicio

### Ver logs en tiempo real:
```bash
docker compose logs -f ms-security
```

### Ver solo los últimos N líneas:
```bash
docker compose logs --tail=50 ms-security
```

### Ver logs con timestamps:
```bash
docker compose logs -f --timestamps ms-security
```

### Ver estado de los contenedores:
```bash
docker compose ps
```

---

## 🔍 Acceso a la Aplicación

Una vez iniciado el servicio, la aplicación estará disponible en:

```
http://localhost:8080
```

### Endpoints principales:
- **Health Check**: `http://localhost:8080/actuator/health`
- **Info de la App**: `http://localhost:8080/actuator/info`

---

## 🔐 Seguridad

### Gestión de Secretos

**⚠️ IMPORTANTE**: Las credenciales en `compose.yaml` son solo para demostración. En producción:

1. **No commits credenciales** al repositorio
2. **Usa variables de entorno** desde un archivo `.env` (agregado a `.gitignore`)
3. **Considera usar** Docker Secrets o herramientas como HashiCorp Vault

Ejemplo de `.env` recomendado:
```bash
JWT_SECRET=cambiar-en-produccion-abc123xyz
JWT_EXPIRATION=3600000
SPRING_MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=app
```

---

## 🗄️ Base de Datos

### Usando MongoDB Atlas (Configuración Actual)

La aplicación está configurada para conectarse a MongoDB Atlas. Las credenciales se definen en `compose.yaml`.

**Estado**: Remoto (en la nube)

### Cambiar a MongoDB Local (Desarrollo)

Si prefieres usar MongoDB localmente para desarrollo:

1. Descomenta la sección `mongodb` en `compose.yaml`:

```yaml
mongodb:
  image: mongo:7.0-alpine
  container_name: mongodb-dev
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: admin123
    MONGO_INITDB_DATABASE: backend-jmmg
  volumes:
    - mongodb_data:/data/db
  restart: unless-stopped
  networks:
    - backend-network
```

2. Actualiza la variable de entorno en la sección `ms-security`:

```yaml
SPRING_MONGODB_URI: mongodb://admin:admin123@mongodb:27017/backend-jmmg?authSource=admin
```

3. Descomenta los volúmenes al final:

```yaml
volumes:
  mongodb_data:
    driver: local
```

4. Reconstruye y reinicia:

```bash
docker compose down
docker compose up -d --build
```

---

## 🐛 Solucionar Problemas

### El contenedor no inicia
```bash
# Ver logs detallados
docker compose logs ms-security

# Verificar recursos disponibles
docker stats
```

### Problemas de conectividad con MongoDB
```bash
# Verificar si el contenedor puede resolver el host
docker compose exec ms-security ping mongodb
```

### Puerto 8080 ya está en uso
```bash
# Cambiar el puerto en compose.yaml
# De:  - "8080:8080"
# A:   - "8081:8080"

docker compose restart
```

### Limpiar todo y comenzar de nuevo
```bash
docker compose down -v
docker system prune -a
docker compose up -d --build
```

---

## 📈 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose up -d` | Iniciar en background |
| `docker compose down` | Detener y remover |
| `docker compose restart` | Reiniciar servicios |
| `docker compose logs -f` | Ver logs en tiempo real |
| `docker compose exec ms-security bash` | Acceder al contenedor |
| `docker compose ps` | Ver estado de contenedores |
| `docker compose build` | Reconstruir imagen |
| `docker compose pull` | Descargar imágenes de registry |

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# Reconstruir la imagen
docker compose build --no-cache

# Reiniciar el servicio
docker compose up -d

# O en un solo comando
docker compose up -d --build
```

---

## 📝 Notas Importantes

- El Dockerfile utiliza **multi-stage build** para optimizar el tamaño final
- La aplicación ejecuta con un **usuario no-root** por seguridad
- Incluye **healthcheck** para monitoreo automático
- Los logs se rotan automáticamente a **10MB máximo**

---

## 🆘 Soporte

Para más información:
- [Documentación Docker Compose](https://docs.docker.com/compose/)
- [Documentación Docker](https://docs.docker.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

---

**Última actualización**: 2026-02-23  
**Versión**: 1.0
