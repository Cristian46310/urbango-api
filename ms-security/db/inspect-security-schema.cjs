/**
 * Read-only: list tables in schema security.
 * Run from repo root:
 *   node ms-security/db/inspect-security-schema.cjs
 */
const path = require('path');
const businessRoot = path.resolve(__dirname, '..', '..', 'ms-business');
require(path.join(businessRoot, 'node_modules', 'dotenv')).config({
  path: path.join(businessRoot, '.env'),
});
const { Client } = require(path.join(businessRoot, 'node_modules', 'pg'));

(async () => {
  if (!process.env.DB_URL) throw new Error('DB_URL missing in ms-business/.env');
  const c = new Client({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const tables = await c.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'security'
    order by table_name
  `);
  console.log('security tables (' + tables.rows.length + '):');
  for (const r of tables.rows) console.log(' -', r.table_name);

  const leftover = await c.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'security'
      and table_name in (
        'microsoft_accounts', 'microsoft_auth_requests',
        'google_accounts', 'google_auth_requests',
        'sessions', 'profiles'
      )
    order by table_name
  `);
  console.log('\norphan / deprecated candidates:');
  if (leftover.rows.length === 0) console.log(' (none)');
  else leftover.rows.forEach((r) => console.log(' -', r.table_name));

  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
