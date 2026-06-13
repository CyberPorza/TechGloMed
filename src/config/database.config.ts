import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA ?? 'public',
  poolMin: parseInt(process.env.DATABASE_POOL_MIN ?? '2', 10),
  poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
}));
