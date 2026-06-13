import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  name: process.env.APP_NAME ?? 'TechGloMed API',
  version: process.env.APP_VERSION ?? '0.1.0',
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
}));
