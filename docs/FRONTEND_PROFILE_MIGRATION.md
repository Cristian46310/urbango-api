# Instrucciones Frontend — Perfil + foto

## Perfil (ms-business `:3000`)

1. Crear ciudadano: `POST /citizen` (JSON + JWT). **No** enviar foto aquí.
2. Ver perfil: `GET /citizen/me` → incluye `photoUrl` (o `null`).
3. Conductor (si JWT tiene `DRIVER`): `POST /driver` → `GET /driver/me`.

Ya no usar `/api/profiles` ni `me.profile` de ms-security.

## Dirección del ciudadano

El formulario debe solicitar `address` y `city`; no debe mostrar ni pedir un
UUID. Enviar el domicilio dentro del mismo `POST /citizen`:

```json
{
  "name": "María Gómez",
  "document": "12345678",
  "email": "maria@example.com",
  "phone": "+573001234567",
  "birthDate": "1998-05-20",
  "address": {
    "address": "Calle 10 #20-30",
    "city": "Manizales"
  }
}
```

La dirección, el ciudadano y la asignación de rol se guardan en una sola
transacción. `addressId` continúa disponible temporalmente para clientes
anteriores, pero no se debe enviar junto con `address`. Las respuestas de
ciudadano incluyen ambos campos: `addressId` y `address`.

El CRUD `/address` se mantiene por compatibilidad, pero no debe mostrarse como
un apartado administrativo general.

## Foto de perfil

Campo multipart: **`photo`**. JPEG / PNG / WebP, máx **5 MB**.

| Acción | Ciudadano | Conductor |
|--------|-----------|-----------|
| Subir / reemplazar | `POST /citizen/me/photo` | `POST /driver/me/photo` |
| Borrar | `DELETE /citizen/me/photo` | `DELETE /driver/me/photo` |

Ejemplo:

```js
const form = new FormData();
form.append('photo', file); // File del input

await fetch(`${BUSINESS_URL}/citizen/me/photo`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  // NO poner Content-Type; el browser pone multipart boundary
  body: form,
});
```

La respuesta es el perfil con `photoUrl` público. Mostrar `<img src={photoUrl} />`.

Orden: primero crear perfil (`POST /citizen` o `/driver`), **después** subir foto.

## Checklist

- [ ] Quitar `/api/profiles`
- [ ] `/me` de security sin `profile`
- [ ] Onboarding citizen/driver en business
- [ ] Upload foto con `FormData` + campo `photo`
- [ ] Usar `photoUrl` del response / `GET .../me`
