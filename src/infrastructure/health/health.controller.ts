import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

/**
 * HealthController exposes a single GET /health endpoint that aggregates
 * liveness checks for all critical infrastructure dependencies.
 *
 * This endpoint is intentionally unauthenticated so that load balancers,
 * container orchestrators (Kubernetes), and uptime monitors can call it
 * without credentials.
 *
 * ⚠️  Do NOT expose sensitive system details in health check responses
 * in production. Consider a separate /health/secure endpoint behind auth
 * for detailed diagnostics.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'System health check',
    description:
      'Returns the health status of all infrastructure dependencies. ' +
      'Used by load balancers and orchestrators. Always unauthenticated.',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // PostgreSQL via Prisma
      () => this.prismaHealth.isHealthy('database', this.prismaService),

      // Redis
      () => this.redisHealth.isHealthy('cache', this.redisService),

      // Disk: alert if less than 10% free on the root partition
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),

      // Memory: alert if RSS exceeds 512 MB
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
    ]);
  }
}
