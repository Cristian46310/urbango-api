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
| `1777345388544-SetupBases.ts` | Esquema base |
| `1779048000000-CreateUserIdMappings.ts` | Tabla mapeo IDs security ↔ business |

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
