import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@shared/filters/all-exceptions.filter';
import { globalValidationPipeOptions } from '@shared/pipes/validation-pipe.config';

/**
 * Bootstrap the TechGloMed NestJS application.
 *
 * Security layers applied here (in order):
 *  1. Helmet   — sets secure HTTP headers
 *  2. CORS     — restricts origins
 *  3. Throttle — applied globally via AppModule guard
 *  4. JWT      — applied globally via AppModule guard
 *  5. Validation pipe — rejects malformed request bodies
 *  6. Exception filter — normalizes all error responses
 *
 * Graceful shutdown hooks ensure DB connections are closed cleanly
 * when the process receives SIGTERM/SIGINT (e.g., from Docker/K8s).
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Disable default NestJS logger; pino takes over via nestjs-pino
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // ── Security Middleware ────────────────────────────────────────────────────

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // required for Swagger UI
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          scriptSrc: ["'self'", "https: 'unsafe-inline'"],
        },
      },
    }),
  );

  app.use(compression());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const corsOrigins = configService
    .get<string>('app.corsOrigins', 'http://localhost:3000')
    .split(',');

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400, // 24h preflight cache
  });

  // ── Global Prefix ─────────────────────────────────────────────────────────
  const globalPrefix = configService.get<string>('app.globalPrefix', 'api/v1');
  app.setGlobalPrefix(globalPrefix, {
    // Health check lives at /health, not /api/v1/health
    // so that load balancers can reach it without knowing the prefix
    exclude: ['health'],
  });

  // ── Global Pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe(globalValidationPipeOptions));

  // ── Global Exception Filter ───────────────────────────────────────────────
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const swaggerEnabled = configService.get<boolean>('swagger.enabled', true);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  if (swaggerEnabled && nodeEnv !== 'production') {
    const swaggerPath = configService.get<string>('swagger.path', 'docs');

    const swaggerDocument = new DocumentBuilder()
      .setTitle(
        configService.get<string>('swagger.title', 'TechGloMed API'),
      )
      .setDescription(
        configService.get<string>(
          'swagger.description',
          'Global Telemedicine Platform REST API',
        ),
      )
      .setVersion(configService.get<string>('app.version', '0.1.0'))
      .addTag('Auth', 'Authentication and token management')
      .addTag('Users', 'User account management')
      .addTag('Doctors', 'Doctor profiles and verification')
      .addTag('Patients', 'Patient profile management')
      .addTag('Appointments', 'Appointment scheduling')
      .addTag('Payments', 'Billing and payment processing')
      .addTag('Reviews', 'Doctor ratings and reviews')
      .addTag('Notifications', 'Notification management')
      .addTag('Health', 'System health checks')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'access-token', // this name is referenced by @ApiBearerAuth('access-token')
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerDocument);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger UI available at /${swaggerPath}`);
  }

  // ── Graceful Shutdown ─────────────────────────────────────────────────────
  // Enables onModuleDestroy() lifecycle hooks to run on SIGTERM/SIGINT.
  // Critical for closing DB connections and Redis before the process exits.
  app.enableShutdownHooks();

  // ── Start Server ──────────────────────────────────────────────────────────
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(`TechGloMed API running on port ${port}`);
  logger.log(`Global prefix: /${globalPrefix}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Fatal error during bootstrap',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
