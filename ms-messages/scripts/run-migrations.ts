import 'tsconfig-paths/register';
import { AppDataSource } from '../typeorm.config';

async function run() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    console.log('Running pending migrations...');
    const res = await AppDataSource.runMigrations();
    console.log('Migrations executed:', res.map((r) => r.name));
    await AppDataSource.destroy();
    console.log('Done.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

void run();
