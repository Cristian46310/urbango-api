# Migraciones TypeORM — ms-business

## Configuración

- **DataSource:** `typeorm.config.ts` en la raíz de `ms-business/`.
- **URL:** `process.env.DB_URL`
- **Entidades:** cargadas recursivamente desde `src/**/entities/*.ts`
- **Migraciones:** `src/migrations/*{.ts,.js}` y `dist/migrations/*.js`
- **synchronize:** `false` (en `app.module.ts` y DataSource)

## Migraciones existentes (referencia)

| Archivo | Propósito |
|---------|-----------|
| `1779566461133-Business.ts` | Esquema base de dominio |
| `1779700000000-HuEnt2SchemaAlign.ts` | Alineación HU-ENTR-2 (turns/tickets/history) |
| `1781539199999-CreateNotificationSubscriptions.ts` | Suscripciones de llegada |
| `1781539200000-DashboardRealtimeWebsocket.ts` | Columna `notifiedAt` (idempotente) |
| `1782000000000-ReviewSchemaHardening.ts` | Índices FK, UNIQUE profiles/foto, drop `buses.gps_id` |

## Comandos típicos

Desde `ms-business/` con `.env` cargado (`DB_URL`):

```bash
# Generar migración (ajustar nombre)
npx typeorm-ts-node-commonjs migration:generate src/migrations/NombreCambio -d typeorm.config.ts

# Ejecutar pendientes
npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts

# Revertir última
npx typeorm-ts-node-commonjs migration:revert -d typeorm.config.ts
```

Si el proyecto usa otro wrapper, verificar scripts en `package.json` antes de inventar comandos.

## Buenas prácticas

1. Una migración por cambio lógico de esquema.
2. No editar migraciones ya aplicadas en entornos compartidos.
3. Probar `migration:run` en BD de desarrollo antes de PR.
4. Mantener entidades y migraciones sincronizadas.
