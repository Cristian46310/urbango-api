#!/usr/bin/env node
/**
 * Aplica el schema SQL de un servicio (un solo archivo schema.sql).
 *
 * Uso:
 *   node scripts/sql-migrate.cjs ms-security
 *   node scripts/sql-migrate.cjs ms-ai
 */
const path = require('path');
const {
  REPO_ROOT,
  loadEnvFile,
  resolveConnectionString,
  createPgClient,
} = require('./lib/pg-env.cjs');
const { runSqlMigrationFile } = require('./lib/sql-migrator.cjs');

const SQL_SERVICES = {
  'ms-security': {
    envFile: 'ms-business/.env',
    envVar: 'DB_URL',
    migrationFile: path.join(REPO_ROOT, 'ms-security', 'db', 'schema.sql'),
  },
  'ms-ai': {
    envFile: 'ms-ai/.env',
    envVar: 'DATABASE_URL',
    fallback: 'postgresql://postgres:postgres@localhost:5432/ms_ai',
    migrationFile: path.join(REPO_ROOT, 'ms-ai', 'sql', 'schema.sql'),
  },
};

async function migrateSqlService(serviceName) {
  const config = SQL_SERVICES[serviceName];
  if (!config) {
    throw new Error(
      `Servicio SQL desconocido: ${serviceName}. Usa: ${Object.keys(SQL_SERVICES).join(', ')}`,
    );
  }

  loadEnvFile(config.envFile);
  const connectionString = resolveConnectionString(
    config.envVar,
    config.fallback,
  );

  const client = createPgClient(connectionString);
  await client.connect();

  try {
    console.log(`[${serviceName}] Ejecutando schema.sql...`);
    const executed = await runSqlMigrationFile(client, {
      service: serviceName,
      migrationFile: config.migrationFile,
    });
    if (executed.length === 0) {
      console.log(`[${serviceName}] Schema ya estaba aplicado.`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const serviceName = process.argv[2];
  if (!serviceName) {
    console.error('Uso: node scripts/sql-migrate.cjs <ms-security|ms-ai>');
    process.exit(1);
  }
  await migrateSqlService(serviceName);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { migrateSqlService, SQL_SERVICES };
