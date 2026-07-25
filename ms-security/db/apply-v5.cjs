/**
 * Apply V5__drop_security_profiles.sql using ms-business/.env DB_URL.
 * Run from ms-business:
 *   node ../ms-security/db/apply-v5.cjs
 */
const path = require('path');
const fs = require('fs');

const businessRoot = path.resolve(__dirname, '..', '..', 'ms-business');
require(path.join(businessRoot, 'node_modules', 'dotenv')).config({
  path: path.join(businessRoot, '.env'),
});

const { Client } = require(path.join(businessRoot, 'node_modules', 'pg'));

(async () => {
  if (!process.env.DB_URL) {
    throw new Error('DB_URL missing in ms-business/.env');
  }
  const c = new Client({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const sql = fs.readFileSync(path.join(__dirname, 'V5__drop_security_profiles.sql'), 'utf8');
  await c.query(sql);
  const table = await c.query(`
    select to_regclass('security.profiles') as exists
  `);
  const perms = await c.query(`
    select count(*)::int as n from security.permissions
    where url = '/profiles' or url like '/profiles/%'
  `);
  console.log('security.profiles exists:', table.rows[0].exists);
  console.log('/profiles permissions left:', perms.rows[0].n);
  await c.end();
  console.log('OK: V5 drop security.profiles applied.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
