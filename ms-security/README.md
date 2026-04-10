# Configuracion segura de variables de entorno

Este servicio carga secretos desde un archivo local fuera del repositorio:

- Ruta esperada: `${user.home}/.config/ms-security/.env`
- Esta ruta se importa desde `src/main/resources/application.properties` usando `spring.config.import`

## 1) Crear archivo local de entorno

```bash
mkdir -p ~/.config/ms-security
cat > ~/.config/ms-security/.env << 'EOF'
SPRING_MONGODB_URI=mongodb+srv://USUARIO:CLAVE@cluster.mongodb.net/?appName=Cluster0
SPRING_MONGODB_DATABASE=db_security
SERVER_PORT=8080
JWT_SECRET=cambia-este-secreto
JWT_EXPIRATION=3600000
NOTIFICATIONS_URL=http://127.0.0.1:8000/api/email/send
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_SCOPE=openid,profile,email
EOF
```

## 2) Ejecutar el servicio

```bash
./mvnw spring-boot:run
```

Spring resolvera automaticamente esas variables y no necesitaras secretos hardcodeados en el repositorio.
