import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  async isHealthy(
    key: string,
    prismaService: PrismaService,
  ): Promise<HealthIndicatorResult> {
    const healthy = await prismaService.isHealthy();

    if (healthy) {
      return this.getStatus(key, true);
    }

    throw new HealthCheckError(
      'Database health check failed',
      this.getStatus(key, false, { message: 'Cannot reach PostgreSQL' }),
    );
  }
}
