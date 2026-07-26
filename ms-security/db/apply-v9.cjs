/**
 * Apply V9__drop_microsoft_oauth.sql using ms-business/.env DB_URL.
 * Run from ms-business:
 *   node ../ms-security/db/apply-v9.cjs
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
    path.join(__dirname, 'V9__drop_microsoft_oauth.sql'),
    'utf8',
  );
  await c.query(sql);
  const leftover = await c.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'security'
      and table_name in ('microsoft_accounts', 'microsoft_auth_requests')
  `);
  if (leftover.rows.length > 0) {
    throw new Error('Microsoft tables still present: ' + leftover.rows.map((r) => r.table_name).join(', '));
  }
  console.log('OK: V9 Microsoft OAuth tables dropped.');
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
