# Load Testing Guide

This document describes how to execute and understand load tests for the backend API. We use [autocannon](https://github.com/mcollina/autocannon) for load testing.

## Prerequisites

Load tests run against a live server. Make sure you start the backend before running the tests:

```bash
npm run dev
# or npm start for production builds
```

## Environment Setup

Add the following variables to your `backend/.env` file to configure the load testing framework:

```env
# The base URL of the API server to load test
LOAD_TEST_BASE_URL="http://localhost:5000/api/v1"

# The number of concurrent connections
LOAD_TEST_CONNECTIONS=50

# The duration of the test in seconds
LOAD_TEST_DURATION=30

# The credentials of a seeded test user
# This user will be used to obtain JWT tokens.
LOAD_TEST_EMAIL="admin@example.com"
LOAD_TEST_PASSWORD="password"
```

> [!WARNING]
> Do not use production databases for load testing as it generates high traffic and can impact real users.

## Running Tests

You can run specific scenarios using the provided npm scripts:

- **Auth (Login)**: `npm run test:load:auth`
- **Organizations**: `npm run test:load:organizations`
- **Customers**: `npm run test:load:customers`
- **Categories**: `npm run test:load:categories`

## Understanding Results

Test results are automatically saved as JSON files in the `backend/load-test-results/` directory (e.g., `auth-login.json`).

The console output will display critical metrics:
- **Requests/sec**: How many requests the server handled per second on average.
- **Latency (p95 / p99)**: The maximum latency experienced by 95% or 99% of requests. This is a crucial metric for measuring tail latency and user experience under load.
- **Errors**: The number of failed requests (e.g., 500s or timeouts).

### Regression Thresholds

The framework includes built-in thresholds to detect performance regressions. The script will automatically fail (`exit 1`) if:
- p95 Latency > 500ms
- Requests/sec < 100
- Error Rate > 1%

These limits can be tweaked directly in `backend/scripts/load-test.ts`.

## Future CI/CD Integration

The non-zero exit code on performance regression makes this suite perfect for CI/CD gates. Future updates may include generating HTML reports and uploading historical data to Grafana or custom dashboards.
