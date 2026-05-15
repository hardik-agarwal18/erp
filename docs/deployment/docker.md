# Docker

## Table of Contents
- [Implemented Files](#implemented-files)
- [Backend Image](#backend-image)
- [Compose Services](#compose-services)

## Implemented Files
- `backend/Dockerfile`
- `backend/docker-compose.yml`
- `backend/docker-compose.test.yml`

## Backend Image
The backend Dockerfile uses a two-stage Node 20 Alpine build:
1. install dependencies and build TypeScript
2. install production dependencies only
3. copy `dist/`, `prisma/`, and `prisma.config.ts`
4. run `node dist/server.js`

It also defines a health check against `http://localhost:3000/health`.

## Compose Services
### `backend/docker-compose.yml`
- `app`
- `postgres`
- `redis`

### `backend/docker-compose.test.yml`
- `postgres-test`
- `redis-test`
