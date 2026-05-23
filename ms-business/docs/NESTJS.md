**Crear entidades**

Para crear las entidades, puedes utilizar el comando `nest g entity <nombre-de-la-entidad>`. Por ejemplo:

```bash
nest g entity Bus
```

Esto creará un archivo llamado `bus.entity.ts` en la carpeta `src/entities`.

**Crear migraciones**

Para crear las migraciones, puedes utilizar el comando `npx typeorm migration:generate <nombre-de-la-migración>`. Por ejemplo:

```bash
npx typeorm-ts-node-commonjs migration:generate ./src/migrations/Business -d ./typeorm.config.ts
```

Esto creará un archivo llamado `init-cinema-schema.ts` en la carpeta `src/migrations`.

**Realizar migraciones**

Para realizar las migraciones, puedes utilizar el comando `npx typeorm migration:run`. Por ejemplo:

```bash
npx typeorm-ts-node-commonjs migration:run -d ./typeorm.config.ts
```

Esto aplicará las migraciones creadas anteriormente a la base de datos.
