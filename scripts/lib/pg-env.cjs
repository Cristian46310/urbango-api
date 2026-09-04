/**
 * Carga variables de entorno y crea un cliente pg reutilizable entre migradores SQL.
 */
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function resolvePgModule() {
  const businessPg = path.join(REPO_ROOT, 'ms-business', 'node_modules', 'pg');
  if (fs.existsSync(businessPg)) {
    return require(businessPg);
  }
  throw new Error(
    'Dependencia `pg` no encontrada. Ejecuta `pnpm install` en ms-business antes de migrar.',
  );
}

function loadEnvFile(envFile) {
  const dotenvPath = path.join(REPO_ROOT, 'ms-business', 'node_modules', 'dotenv');
  const dotenv = require(dotenvPath);
  const fullPath = path.isAbsolute(envFile) ? envFile : path.join(REPO_ROOT, envFile);
  dotenv.config({ path: fullPath });
}

function resolveConnectionString(envVar, fallback) {
  const value = process.env[envVar] || fallback;
  if (!value) {
    throw new Error(`${envVar} no está definida. Revisa el .env del servicio.`);
  }
  return value;
}

function createPgClient(connectionString) {
  const { Client } = resolvePgModule();
  const options = { connectionString };
  if (
    /supabase\.co/i.test(connectionString) ||
    /sslmode=require/i.test(connectionString)
  ) {
    options.ssl = { rejectUnauthorized: false };
  }
  return new Client(options);
}

module.exports = {
  REPO_ROOT,
  loadEnvFile,
  resolveConnectionString,
  createPgClient,
};
