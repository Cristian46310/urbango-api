/**

 * Apply V2__seed_permissions.sql using ms-business/.env DB_URL (pooler).

 * Run from ms-business so `pg` and `dotenv` resolve:

 *   node ../ms-security/db/apply-v2.cjs

 *

 * Prerequisite: V1 applied (schema + roles). Safe to re-run (idempotent).

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

  const sql = fs.readFileSync(path.join(__dirname, 'V2__seed_permissions.sql'), 'utf8');

  await c.query(sql);



  const permCount = await c.query(`select count(*)::int as n from security.permissions`);

  console.log('permissions:', permCount.rows[0].n);



  const byRole = await c.query(`

    select r.name, count(rp.id)::int as permission_count

    from security.roles r

    left join security.role_permissions rp on rp.role_id = r.id

    group by r.name

    order by r.name

  `);

  console.log('role_permissions:');

  for (const row of byRole.rows) {

    console.log(`  ${row.name}=${row.permission_count}`);

  }



  await c.end();

  console.log('OK: V2 permissions seed applied.');

})().catch((e) => {

  console.error(e);

  process.exit(1);

});


