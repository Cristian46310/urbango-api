/**
 * Apply V10__drop_unused_tables.sql using ms-business/.env DB_URL.
 * Drops microsoft_*, google_*, sessions (unused / placeholders).
 * Run from ms-business:
 *   node ../ms-security/db/apply-v10.cjs
 */
const path = require('path');
const fs = require('fs');

const businessRoot = path.resolve(__dirname, '..', '..', 'ms-business');
require(path.join(businessRoot, 'node_modules', 'dotenv')).config({
  path: path.join(businessRoot, '.env'),
});

const { Client } = require(path.join(businessRoot, 'node_modules', 'pg'));

const EXPECTED_GONE = [
  'microsoft_accounts',
  'microsoft_auth_requests',
  'google_accounts',
  'google_auth_requests',
  'sessions',
];

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
    path.join(__dirname, 'V10__drop_unused_tables.sql'),
    'utf8',
  );
  await c.query(sql);
  const leftover = await c.query(
    `
    select table_name
    from information_schema.tables
    where table_schema = 'security'
      and table_name = any($1::text[])
    order by table_name
  `,
    [EXPECTED_GONE],
  );
  if (leftover.rows.length > 0) {
    throw new Error(
      'Tables still present: ' + leftover.rows.map((r) => r.table_name).join(', '),
    );
  }
  const remaining = await c.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'security'
    order by table_name
  `);
  console.log('OK: V10 unused tables dropped.');
  console.log(
    'security tables now:',
    remaining.rows.map((r) => r.table_name).join(', '),
  );
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
