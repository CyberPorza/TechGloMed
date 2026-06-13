# =============================================================================
# TechGloMed — Developer Makefile
# Usage: make <target>
# =============================================================================

.PHONY: help install dev build test lint format \
        docker-up docker-down docker-logs \
        db-migrate db-migrate-deploy db-studio db-seed \
        clean

## Print this help message
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

## Install all Node dependencies
install:
	npm ci

## Start the API in development mode (hot reload)
dev:
	npm run start:dev

## Compile TypeScript to dist/
build:
	npm run build

## Run all unit tests
test:
	npm test

## Run tests with coverage report
test-cov:
	npm run test:cov

## Run e2e tests
test-e2e:
	npm run test:e2e

## Lint all source files
lint:
	npm run lint

## Format all source files with Prettier
format:
	npm run format

# ── Docker ────────────────────────────────────────────────────────────────────

## Start all Docker services (detached)
docker-up:
	docker compose up -d

## Start all Docker services including dev tools (Adminer, Redis Commander)
docker-up-tools:
	docker compose --profile tools up -d

## Stop all Docker services
docker-down:
	docker compose down

## Stop and remove volumes (⚠ destroys data)
docker-down-v:
	docker compose down -v

## Tail API container logs
docker-logs:
	docker compose logs -f api

# ── Database ──────────────────────────────────────────────────────────────────

## Run Prisma migrations in development
db-migrate:
	npm run prisma:migrate:dev

## Deploy migrations (CI/production)
db-migrate-deploy:
	npm run prisma:migrate:deploy

## Generate Prisma client after schema changes
db-generate:
	npm run prisma:generate

## Open Prisma Studio (visual DB browser)
db-studio:
	npm run prisma:studio

## Seed the database with development fixtures
db-seed:
	npm run prisma:seed

# ── Utilities ─────────────────────────────────────────────────────────────────

## Remove build artifacts
clean:
	rm -rf dist/ coverage/
