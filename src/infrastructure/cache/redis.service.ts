import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * RedisService wraps ioredis and provides a strongly-typed interface
 * for cache operations throughout the application.
 *
 * Design decisions:
 * - Single shared Redis client (connection pool managed by ioredis internally)
 * - All methods are async and return typed results — no `any`
 * - Keys are namespaced to prevent collisions across modules
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(`Redis retry attempt #${times} in ${delay}ms`);
        return delay;
      },
      enableReadyCheck: true,
    });

    this.client.on('connect', () =>
      this.logger.log('Redis connection established.'),
    );
    this.client.on('error', (err: Error) =>
      this.logger.error(`Redis error: ${err.message}`, err.stack),
    );
    this.client.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting...'),
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection...');
    await this.client.quit();
  }

  // ── Core Cache Operations ───────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // ── JSON Helpers ───────────────────────────────────────────────────────────

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // ── Token Blocklist (used by Auth for refresh token revocation) ────────────

  async addToBlocklist(token: string, expiresInSeconds: number): Promise<void> {
    await this.set(`blocklist:${token}`, '1', expiresInSeconds);
  }

  async isBlocklisted(token: string): Promise<boolean> {
    return this.exists(`blocklist:${token}`);
  }

  // ── Health Check ───────────────────────────────────────────────────────────

  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
