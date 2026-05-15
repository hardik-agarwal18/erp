# Testing Infrastructure

This backend uses Jest + Supertest with a split between `unit` and `integration` suites.

## Key behaviors

- `tests/unit/*` runs without database or Redis setup.
- `tests/integration/*` connects to PostgreSQL and Redis, resets state before each test, and enforces test-only connection safety checks.
- Email sending is mocked automatically when `NODE_ENV=test`.

## Environment

Copy `.env.test.example` to `.env.test` or export the same variables in your shell.

Required:

- `TEST_DATABASE_URL`
- `TEST_REDIS_URL`

The test helpers refuse to run if the database URL does not look like a test database.

## Useful commands

- `npm test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:coverage`

## Containerized test services

Use `docker-compose.test.yml` for isolated local test infrastructure.
