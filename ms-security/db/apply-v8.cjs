/**
 * Apply V8__admin_domain_list_permissions.sql using ms-business/.env DB_URL.
 * Run from ms-business:
 *   node ../ms-security/db/apply-v8.cjs
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
  const sql = fs.readFileSync(
    path.join(__dirname, 'V8__admin_domain_list_permissions.sql'),
    'utf8',
  );
  await c.query(sql);
  const n = await c.query(`
    select count(*)::int as n from security.permissions
    where url like '/payment-method%'
       or url like '/supervisor%'
       or url like '/ticket%'
       or url like '/turn%'
  `);
  console.log('domain admin permissions:', n.rows[0].n);
  await c.end();
  console.log('OK: V8 admin domain list permissions applied.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
