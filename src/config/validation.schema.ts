import * as Joi from 'joi';

/**
 * Joi validation schema for all environment variables.
 * The application will refuse to start if any required variable is missing
 * or has an invalid value. This prevents misconfigured deployments from
 * running silently with dangerous defaults.
 */
export const validationSchema = Joi.object({
  // ── Application ────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  APP_PORT: Joi.number().integer().min(1).max(65535).default(3000),
  APP_NAME: Joi.string().default('TechGloMed API'),
  APP_VERSION: Joi.string().default('0.1.0'),
  API_GLOBAL_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // ── Database ───────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().integer().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SCHEMA: Joi.string().default('public'),
  DATABASE_POOL_MIN: Joi.number().integer().min(1).default(2),
  DATABASE_POOL_MAX: Joi.number().integer().min(1).default(10),

  // ── Redis ──────────────────────────────────────────────────────────────────
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).max(15).default(0),
  REDIS_TTL_SECONDS: Joi.number().integer().min(1).default(3600),

  // ── JWT ────────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Throttling ─────────────────────────────────────────────────────────────
  THROTTLE_TTL_SECONDS: Joi.number().integer().default(60),
  THROTTLE_LIMIT: Joi.number().integer().default(100),

  // ── Logging ────────────────────────────────────────────────────────────────
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('debug'),
  LOG_PRETTY_PRINT: Joi.boolean().default(true),

  // ── Swagger ────────────────────────────────────────────────────────────────
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('docs'),
  SWAGGER_TITLE: Joi.string().default('TechGloMed API'),
  SWAGGER_DESCRIPTION: Joi.string().optional(),
});

export const validationOptions = {
  abortEarly: false,   // collect ALL errors, don't stop at first
  allowUnknown: true,  // allow extra env vars (e.g., CI-injected)
};
