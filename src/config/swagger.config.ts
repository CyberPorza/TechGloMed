import { registerAs } from '@nestjs/config';

export const swaggerConfig = registerAs('swagger', () => ({
  enabled: process.env.SWAGGER_ENABLED === 'true',
  path: process.env.SWAGGER_PATH ?? 'docs',
  title: process.env.SWAGGER_TITLE ?? 'TechGloMed API',
  description:
    process.env.SWAGGER_DESCRIPTION ??
    'Global Telemedicine Platform — REST API Documentation',
  version: process.env.APP_VERSION ?? '0.1.0',
}));
