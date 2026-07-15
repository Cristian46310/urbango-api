/**
 * Apply V3__users_password_nullable.sql using ms-business/.env DB_URL.
 * Run from ms-business:
 *   node ../ms-security/db/apply-v3.cjs
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
  const sql = fs.readFileSync(path.join(__dirname, 'V3__users_password_nullable.sql'), 'utf8');
  await c.query(sql);
  const col = await c.query(`
    select is_nullable
    from information_schema.columns
    where table_schema = 'security' and table_name = 'users' and column_name = 'password'
  `);
  console.log('users.password nullable:', col.rows[0]?.is_nullable);
  await c.end();
  console.log('OK: V3 password nullable applied.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
