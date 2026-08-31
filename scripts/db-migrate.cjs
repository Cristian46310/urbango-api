#!/usr/bin/env node
/**
 * Orquestador único de migraciones del monorepo.
 *
 * Orden:
 *   1. ms-security  (SQL → schema security)
 *   2. ms-business  (TypeORM → schema public)
 *   3. ms-messages  (TypeORM → schema public, misma BD)
 *   4. ms-ai        (SQL → BD ms_ai)
 *
 * Uso:
 *   node scripts/db-migrate.cjs
 *   node scripts/db-migrate.cjs --only ms-business
 *   node scripts/db-migrate.cjs --only ms-security,ms-ai
 */
const { spawnSync } = require('child_process');
const path = require('path');
const { migrateSqlService } = require('./sql-migrate.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');

const ORDER = ['ms-security', 'ms-business', 'ms-messages', 'ms-ai'];

function parseOnlyArg() {
  const index = process.argv.indexOf('--only');
  if (index === -1) {
    return null;
  }
  const value = process.argv[index + 1];
  if (!value) {
    throw new Error('Falta valor para --only (ej: ms-business o ms-security,ms-ai)');
  }
  return value.split(',').map((item) => item.trim());
}

function runNestMigration(serviceDir) {
  const cwd = path.join(REPO_ROOT, serviceDir);
  const result = spawnSync('pnpm', ['run', 'migration:run'], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(`Migración fallida en ${serviceDir}`);
  }
}

async function migrateService(serviceName) {
  console.log(`\n=== ${serviceName} ===`);

  if (serviceName === 'ms-security' || serviceName === 'ms-ai') {
    await migrateSqlService(serviceName);
    return;
  }

  if (serviceName === 'ms-business' || serviceName === 'ms-messages') {
    runNestMigration(serviceName);
    return;
  }

  throw new Error(`Servicio desconocido: ${serviceName}`);
}

async function main() {
  const only = parseOnlyArg();
  const services = only ?? ORDER;

  for (const service of services) {
    if (!ORDER.includes(service)) {
      throw new Error(
        `Servicio no soportado: ${service}. Válidos: ${ORDER.join(', ')}`,
      );
    }
  }

  console.log('Migraciones del monorepo dev-backend-uc');
  console.log(`Servicios: ${services.join(' → ')}`);

  for (const service of services) {
    await migrateService(service);
  }

  console.log('\nMigraciones completadas.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
