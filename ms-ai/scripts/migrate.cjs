#!/usr/bin/env node
/**
 * Migraciones SQL de ms-ai.
 * Atajo: node ms-ai/scripts/migrate.cjs
 * Equivalente: node scripts/sql-migrate.cjs ms-ai
 */
const path = require('path');
const { migrateSqlService } = require(path.join(
  __dirname,
  '..',
  '..',
  'scripts',
  'sql-migrate.cjs',
));

migrateSqlService('ms-ai').catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
