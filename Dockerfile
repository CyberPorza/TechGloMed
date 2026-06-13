# =============================================================================
# TechGloMed API — Multi-Stage Dockerfile
#
# Stage 1: deps       — install production node_modules
# Stage 2: builder    — compile TypeScript
# Stage 3: production — minimal runtime image (no devDeps, no source)
# =============================================================================

# ── Base image ────────────────────────────────────────────────────────────────
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS base
WORKDIR /app
# Security: run as non-root in all stages
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (including dev) so we can generate the Prisma client
RUN npm ci

# Generate Prisma client (required before build)
RUN npx prisma generate

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

# Copy only production node_modules
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy generated Prisma client
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and migrations (needed for migrate deploy at startup)
COPY prisma ./prisma

# Switch to non-root user
USER nestjs

EXPOSE 3000

# Healthcheck — Docker will report container as unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Run Prisma migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
