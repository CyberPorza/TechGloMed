import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService wraps the Prisma Client and integrates it with the NestJS
 * module lifecycle. It connects on module init and gracefully disconnects
 * on module destroy, preventing connection leaks in both production and
 * test environments.
 *
 * All repository classes should inject PrismaService rather than
 * instantiating PrismaClient directly.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to the database via Prisma...');
    await this.$connect();
    this.logger.log('Database connection established.');

    // Log slow queries (>500 ms) in development for performance awareness
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (event: { duration: number; query: string }) => {
        if (event.duration > 500) {
          this.logger.warn(
            `Slow query detected (${event.duration}ms): ${event.query}`,
          );
        }
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from the database...');
    await this.$disconnect();
  }

  /**
   * Used by TerminusHealthIndicator to verify DB liveness.
   * Runs a lightweight raw query instead of a full model query.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
