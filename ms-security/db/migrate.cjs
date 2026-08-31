#!/usr/bin/env node
/**
 * Migraciones SQL del schema `security`.
 * Atajo: node ms-security/db/migrate.cjs
 * Equivalente: node scripts/sql-migrate.cjs ms-security
 */
const path = require('path');
const { migrateSqlService } = require(path.join(
  __dirname,
  '..',
  '..',
  'scripts',
  'sql-migrate.cjs',
));

migrateSqlService('ms-security').catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
