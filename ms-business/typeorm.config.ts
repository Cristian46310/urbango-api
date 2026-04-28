import 'reflect-metadata';
import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

function loadEntities() {
  const src = path.join(__dirname, 'src');
  const entities: any[] = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (/entities\/.+\.ts$/.test(full) && !full.endsWith('.d.ts')) {
        const mod = require(full);
        for (const v of Object.values(mod)) {
          if (typeof v === 'function') entities.push(v);
        }
      }
    }
  }
  walk(src);
  return entities;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DB_URL,
  entities: loadEntities(),
  migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*.js'],
  synchronize: false,
});