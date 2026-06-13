import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(
    key: string,
    redisService: RedisService,
  ): Promise<HealthIndicatorResult> {
    const healthy = await redisService.isHealthy();

    if (healthy) {
      return this.getStatus(key, true);
    }

    throw new HealthCheckError(
      'Cache health check failed',
      this.getStatus(key, false, { message: 'Cannot reach Redis' }),
    );
  }
}
