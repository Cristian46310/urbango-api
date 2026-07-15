/**
 * Apply V1__security_schema.sql using ms-business/.env DB_URL (pooler).
 * Run from ms-business so `pg` and `dotenv` resolve:
 *   node ../ms-security/db/apply-v1.cjs
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
  const sql = fs.readFileSync(path.join(__dirname, 'V1__security_schema.sql'), 'utf8');
  await c.query(sql);
  const tables = await c.query(
    `select table_name from information_schema.tables where table_schema = 'security' order by table_name`,
  );
  console.log('tables:', tables.rows.map((r) => r.table_name).join(', '));
  const roles = await c.query(
    `select id::text as id, name from security.roles order by name`,
  );
  console.log('roles:');
  for (const row of roles.rows) {
    console.log(`${row.name}=${row.id}`);
  }
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
