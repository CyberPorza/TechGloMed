# TechGloMed API

> Global Telemedicine Platform — Backend API (Sprint 0: Engineering Bootstrap)

---

## Architecture Overview

TechGloMed follows **Clean Architecture** organized as a **Modular Monolith**. The codebase is structured so that each module can be extracted into a microservice in the future without rewriting business logic.

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Clients / SDKs                  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   NestJS Application                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Global Middleware Layer               │    │
│  │  Helmet · CORS · Compression · Rate Limiting    │    │
│  └─────────────────────┬───────────────────────────┘    │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │              Global Guard Layer                  │    │
│  │         JwtAuthGuard · RolesGuard               │    │
│  └─────────────────────┬───────────────────────────┘    │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │             Feature Modules                      │    │
│  │  Auth · Users · Doctors · Patients               │    │
│  │  Appointments · Payments · Reviews               │    │
│  │  Notifications                                   │    │
│  └─────────────────────┬───────────────────────────┘    │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │           Infrastructure Layer                   │    │
│  │   PrismaService (PostgreSQL) · RedisService      │    │
│  │   HealthModule · LoggingInterceptor              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Implementation |
|---|---|
| **Secure by default** | Every route requires JWT auth unless explicitly `@Public()` |
| **Fail fast** | Joi validates all env vars at startup — missing secrets abort boot |
| **No `any`** | TypeScript strict mode + ESLint `no-explicit-any: error` |
| **PHI safety** | Request bodies never logged; raw DB errors sanitized before client response |
| **Graceful shutdown** | `enableShutdownHooks()` ensures connection pools drain cleanly |

---

## Project Structure

```
techglommed/
├── prisma/
│   ├── schema.prisma          # Database schema (single source of truth)
│   └── seed.ts                # Development data fixtures
│
├── src/
│   ├── main.ts                # Bootstrap entry point
│   ├── app.module.ts          # Root module (wires everything)
│   │
│   ├── config/                # Centralized configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   ├── swagger.config.ts
│   │   ├── throttle.config.ts
│   │   └── validation.schema.ts  # Joi schema — validates all env vars
│   │
│   ├── infrastructure/        # Cross-cutting technical concerns
│   │   ├── database/
│   │   │   ├── prisma.service.ts  # PrismaClient wrapper + lifecycle
│   │   │   └── prisma.module.ts   # @Global() — available everywhere
│   │   ├── cache/
│   │   │   ├── redis.service.ts   # Typed Redis wrapper
│   │   │   └── redis.module.ts    # @Global()
│   │   └── health/
│   │       ├── health.controller.ts  # GET /health
│   │       ├── health.module.ts
│   │       ├── prisma.health.ts      # Terminus indicator
│   │       └── redis.health.ts       # Terminus indicator
│   │
│   ├── shared/                # Reusable cross-module code
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   │   ├── public.decorator.ts        # @Public()
│   │   │   └── roles.decorator.ts         # @Roles()
│   │   ├── enums/
│   │   │   └── user-role.enum.ts
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts   # Global error handler
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts          # Global JWT enforcement
│   │   │   └── roles.guard.ts             # RBAC enforcement
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts     # Request/response logging
│   │   │   └── transform.interceptor.ts   # Standard response envelope
│   │   ├── pipes/
│   │   │   └── validation-pipe.config.ts  # Global ValidationPipe options
│   │   └── utils/
│   │       └── pagination.dto.ts          # Shared pagination DTO + helper
│   │
│   └── modules/               # Business domain modules
│       ├── auth/              # Login, register, token refresh
│       ├── users/             # User account management
│       ├── doctors/           # Doctor profiles + verification
│       ├── patients/          # Patient profiles
│       ├── appointments/      # Scheduling and sessions
│       ├── payments/          # Billing and payment processing
│       ├── reviews/           # Doctor ratings
│       └── notifications/     # Email, SMS, push, in-app
│
├── Dockerfile                 # Multi-stage production image
├── docker-compose.yml         # Local development environment
├── docker-compose.prod.yml    # Production overrides
├── Makefile                   # Developer shortcuts
└── .env.example               # Environment variable template
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Clone and configure
```bash
git clone <repo-url>
cd techglommed
cp .env.example .env
# Edit .env — fill in DATABASE_* and JWT_* values
```

### 2. Start infrastructure
```bash
make docker-up
```

### 3. Install dependencies and run migrations
```bash
make install
make db-migrate
make db-seed
```

### 4. Start the API
```bash
make dev
```

The API will be available at:
- **API:** `http://localhost:3000/api/v1`
- **Swagger UI:** `http://localhost:3000/docs`
- **Health check:** `http://localhost:3000/health`
- **Adminer (DB UI):** `http://localhost:8080` _(requires `make docker-up-tools`)_

---

## Environment Variables

All environment variables are validated at startup via Joi. The app will **refuse to start** with missing or invalid values. See `.env.example` for the full list with descriptions.

Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full Prisma connection string |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars. Used to sign access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars. Used to sign refresh tokens |
| `DATABASE_PASSWORD` | ✅ | PostgreSQL password |
| `NODE_ENV` | ✅ | `development` \| `production` \| `test` |

---

## API Response Contract

### Success
Every successful response is wrapped in a standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-13T10:00:00.000Z"
}
```

### Error
All errors share a consistent shape:
```json
{
  "statusCode": 400,
  "timestamp": "2026-06-13T10:00:00.000Z",
  "path": "/api/v1/users",
  "method": "POST",
  "message": ["email must be an email"],
  "error": "BadRequestException",
  "requestId": "abc-123"
}
```

---

## Authentication Flow

```
POST /api/v1/auth/register    → { accessToken, refreshToken }
POST /api/v1/auth/login       → { accessToken, refreshToken }
POST /api/v1/auth/refresh     → { accessToken, refreshToken }  (rotates tokens)
POST /api/v1/auth/logout      → 204 No Content  (blocklists refresh token)
```

All routes are **protected by default**. Mark public endpoints with `@Public()`.

---

## Testing

```bash
make test          # Unit tests
make test-cov      # With coverage report
make test-e2e      # End-to-end tests
```

Each module is independently testable. All external dependencies (Prisma, Redis, JWT) are injected and can be mocked in isolation.

---

## Sprint Roadmap

| Sprint | Focus |
|---|---|
| **Sprint 0 (current)** | Engineering bootstrap — this foundation |
| Sprint 1 | Auth flows, User + Doctor + Patient CRUD |
| Sprint 2 | Appointment scheduling, availability management |
| Sprint 3 | Video session integration, Payments |
| Sprint 4 | Reviews, Notifications, Doctor verification workflow |
| Sprint 5 | Performance, observability, security hardening |
