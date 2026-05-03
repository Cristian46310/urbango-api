import { DataSource } from 'typeorm';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'postgres', // si usas Supabase
  url: process.env.DB_URL,
  entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity.js'],
  migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*.js'],
  synchronize: false,
});