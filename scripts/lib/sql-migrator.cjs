/**
 * Ejecutor SQL: un solo archivo schema.sql por servicio.
 * Registra la ejecución en public.db_migrations (service + version).
 */
const fs = require('fs');

const TRACKING_DDL = `
CREATE TABLE IF NOT EXISTS public.db_migrations (
  service VARCHAR(64) NOT NULL,
  version VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (service, version)
);
`;

const DEFAULT_VERSION = 'schema';

async function isApplied(client, service, version) {
  const result = await client.query(
    'SELECT 1 FROM public.db_migrations WHERE service = $1 AND version = $2',
    [service, version],
  );
  return result.rows.length > 0;
}

async function runSqlMigrationFile(client, options) {
  const { service, migrationFile, version = DEFAULT_VERSION } = options;

  if (!fs.existsSync(migrationFile)) {
    throw new Error(`Archivo de migración no encontrado: ${migrationFile}`);
  }

  await client.query(TRACKING_DDL);

  if (await isApplied(client, service, version)) {
    console.log(`  skip ${service}/${version} (ya aplicado)`);
    return [];
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO public.db_migrations (service, version) VALUES ($1, $2)',
      [service, version],
    );
    await client.query('COMMIT');
    console.log(`  applied ${service}/${version}`);
    return [version];
  } catch (error) {
    await client.query('ROLLBACK');
    error.message = `Fallo en ${service}/${version}: ${error.message}`;
    throw error;
  }
}

module.exports = { runSqlMigrationFile, DEFAULT_VERSION };
