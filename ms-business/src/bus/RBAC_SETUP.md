# Configuración de Permisos RBAC para Endpoints de Bus

Este documento describe cómo registrar los permisos para los endpoints de bus en ms-security.

## Endpoints Protegidos de Bus

Los siguientes endpoints requieren autenticación y permisos específicos:

| Endpoint | Método | Descripción | Rol Requerido |
|----------|--------|-------------|---------------|
| `/api/bus` | POST | Crear un bus | BUSINESS_ADMIN |
| `/api/bus/fleet` | GET | Listar flota de mi empresa | BUSINESS_ADMIN |
| `/api/bus/:id` | PATCH | Actualizar un bus | BUSINESS_ADMIN |
| `/api/bus/:id` | DELETE | Eliminar un bus | BUSINESS_ADMIN |
| `/api/bus/:id/photo` | POST | Subir foto del bus | BUSINESS_ADMIN |

Los endpoints GET (listar y obtener) permanecen públicos.

## Instrucciones para Registrar Permisos

### Opción 1: Usando curl

Primero, crea los permisos (requiere autenticación como ADMIN):

```bash
# 1. Crear permiso: POST /api/bus
curl -X POST http://localhost:8080/api/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{
    "url": "/api/bus",
    "method": "POST"
  }'

# Guarda el ID retornado como PERM_POST_BUS

# 2. Crear permiso: PATCH /api/bus/:id
curl -X POST http://localhost:8080/api/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{
    "url": "/api/bus/*",
    "method": "PATCH"
  }'

# Guarda el ID retornado como PERM_PATCH_BUS

# 3. Crear permiso: DELETE /api/bus/:id
curl -X POST http://localhost:8080/api/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{
    "url": "/api/bus/*",
    "method": "DELETE"
  }'

# Guarda el ID retornado como PERM_DELETE_BUS

# 4. Crear permiso: POST /api/bus/:id/photo
curl -X POST http://localhost:8080/api/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{
    "url": "/api/bus/*/photo",
    "method": "POST"
  }'

# Guarda el ID retornado como PERM_POST_PHOTO
```

### Luego, asigna los permisos al rol BUSINESS_ADMIN:

```bash
# Obtén el ID del rol BUSINESS_ADMIN
curl http://localhost:8080/api/roles?search=BUSINESS_ADMIN

# Asigna múltiples permisos al rol
curl -X POST http://localhost:8080/api/role-permission/assign-multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{
    "roleId": "<BUSINESS_ADMIN_ROLE_ID>",
    "permissionIds": [
      "<PERM_POST_BUS>",
      "<PERM_PATCH_BUS>",
      "<PERM_DELETE_BUS>",
      "<PERM_POST_PHOTO>"
    ]
  }'
```

### Opción 2: Usando MongoDB Shell (acceso directo a BD)

```javascript
// Conectarse a MongoDB de ms-security
use ms_security

// 1. Crear permisos
db.permission.insertMany([
  {
    url: "/api/bus",
    method: "POST"
  },
  {
    url: "/api/bus/*",
    method: "PATCH"
  },
  {
    url: "/api/bus/*",
    method: "DELETE"
  },
  {
    url: "/api/bus/*/photo",
    method: "POST"
  }
])

// 2. Obtener IDs de los permisos insertados
const busPermissions = db.permission.find({
  url: { $in: ["/api/bus", "/api/bus/*", "/api/bus/*/photo"] }
}).toArray()

// 3. Obtener ID del rol BUSINESS_ADMIN
const businessAdminRole = db.role.findOne({ name: "BUSINESS_ADMIN" })

// 4. Asignar permisos al rol
busPermissions.forEach(perm => {
  db.rolepermission.insertOne({
    role: businessAdminRole._id,
    permission: perm._id
  })
})
```

## Validación

Después de registrar los permisos, verifica que funcionan:

```bash
# 1. Login como usuario con rol BUSINESS_ADMIN
curl -X POST http://localhost:3000/api/bus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BUSINESS_ADMIN_JWT>" \
  -d '{
    "plate": "ABC-123",
    "model": "Mercedes-Benz O500",
    "capacity": 40,
    "year": 2023,
    "seatedCapacity": 35,
    "standingCapacity": 5,
    "status": "operativo"
  }'

# 2. Listar flota de la empresa
curl http://localhost:3000/api/bus/fleet \
  -H "Authorization: Bearer <BUSINESS_ADMIN_JWT>"

# 3. Subir foto (después de crear, usar el id del bus)
curl -X POST http://localhost:3000/api/bus/<BUS_ID>/photo \
  -H "Authorization: Bearer <BUSINESS_ADMIN_JWT>" \
  -F "photo=@/ruta/foto-bus.jpg"

# La respuesta debe incluir el código QR generado automáticamente
```

## Notas Importantes

- El `enterpriseId` se resuelve desde el perfil de conductor en ms-business (`persons.enterpriseId`)
- El endpoint POST /api/bus genera automáticamente el código QR con los datos del bus
- Los administradores de empresa solo pueden crear buses para su propia empresa (validado contra la empresa del conductor)
- Las fotos se almacenan en Supabase Storage (bucket: `bus-photos`)
