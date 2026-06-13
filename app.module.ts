import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Config
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  swaggerConfig,
  throttleConfig,
  validationOptions,
  validationSchema,
} from '@config/index';

// Infrastructure
import { PrismaModule } from '@infrastructure/database/prisma.module';
import { RedisModule } from '@infrastructure/cache/redis.module';
import { HealthModule } from '@infrastructure/health/health.module';

// Shared
import { AllExceptionsFilter } from '@shared/filters/all-exceptions.filter';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { TransformInterceptor } from '@shared/interceptors/transform.interceptor';

// Feature modules
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { DoctorsModule } from '@modules/doctors/doctors.module';
import { PatientsModule } from '@modules/patients/patients.module';
import { AppointmentsModule } from '@modules/appointments/appointments.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────────────
    // isGlobal: true means ConfigService is available everywhere without re-import
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        swaggerConfig,
        throttleConfig,
      ],
      validationSchema,
      validationOptions,
      cache: true, // cache parsed env for performance
    }),

    // ── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10) * 1000,
            limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
          },
        ],
      }),
    }),

    // ── Infrastructure ───────────────────────────────────────────────────────
    PrismaModule,
    RedisModule,
    HealthModule,

    // ── Feature Modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
  ],

  providers: [
    // Global exception handler — must be first
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global JWT guard — every route requires auth unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global response logger
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global response envelope wrapper
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
