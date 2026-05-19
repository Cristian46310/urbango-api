# Probar la API con Swagger — ms-business

## URLs

| Recurso | URL local |
|---------|-----------|
| Swagger UI | `http://localhost:3000/docs` |
| OpenAPI JSON | `http://localhost:3000/docs-json` |

Configuración en `src/main.ts` (`DocumentBuilder`, `SwaggerModule.setup('docs', …)`).

## Arrancar el servicio

```bash
cd ms-business
pnpm install
pnpm run start:dev
```

Requisitos: PostgreSQL accesible (`.env` con `DATABASE_*`) y **ms-security** en `8080` si vas a probar rutas protegidas.

## Obtener un JWT (ms-security)

1. Login en ms-security, por ejemplo:

```bash
curl -s -X POST http://localhost:8080/api/public/security/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"tu@email.com","password":"tu-password"}' | jq -r .token
```

2. Copia el valor del campo `token` (sin el prefijo `Bearer`).

Alternativa: usar Swagger de ms-security (`http://localhost:8080/swagger-ui/index.html`) en `POST /api/public/security/login`.

## Autorizar en Swagger UI (NestJS)

1. Abre `http://localhost:3000/docs`.
2. Clic en **Authorize** (candado).
3. En el esquema **bearer**, pega **solo el JWT** (Swagger añade `Bearer` automáticamente).
4. **Authorize** → **Close**.

Opciones activas en `main.ts`: `persistAuthorization: true` (el token se conserva al recargar la página).

## Rutas públicas vs protegidas

- Rutas con `@Public()` **no** exigen JWT en Swagger (lo resuelve `applySwaggerBearerAuth` en `src/shared/swagger/apply-swagger-bearer-auth.ts`).
- El resto muestra candado y requiere el bearer configurado arriba.
- En código: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('DRIVER')` + `@ApiBearerAuth()` en controllers protegidos.

Ejemplo protegido: `POST /incident-reports/driver` (rol `DRIVER`).

## Probar un endpoint protegido (ejemplo)

1. Autoriza con JWT de un usuario con rol adecuado.
2. Expande el tag del dominio (p. ej. **Incident Reports**).
3. **Try it out** → completa body/query → **Execute**.
4. Si `401`: token inválido o expirado; renueva login en ms-security.
5. Si `403`: el usuario no tiene el rol requerido (`@Roles`).

## Documentar endpoints nuevos

En el controller:

```typescript
@ApiTags('Mi Dominio')
@ApiBearerAuth()
@ApiOperation({ summary: 'Crear recurso' })
@ApiCreatedResponse({ type: ResponseMiDto })
```

En DTOs: `@ApiProperty()` / `@ApiPropertyOptional()` para que el schema aparezca en el body de Swagger.

Usar `PartialType` desde `@nestjs/swagger` (no `@nestjs/mapped-types`) en `update-*.dto.ts`.

## Checklist rápido

- [ ] `pnpm run start:dev` sin errores
- [ ] `/docs` carga y lista los tags esperados
- [ ] JWT válido en **Authorize**
- [ ] Endpoint público funciona sin token
- [ ] Endpoint protegido responde 401 sin token y 200/201 con token + rol correcto
