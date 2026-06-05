# Environments

## Table of Contents
- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Notes](#frontend-environment-notes)

## Backend Environment Variables
Validated in `backend/src/config/env.ts`:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `REDIS_URL`
- `TEST_REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_VERIFY_SECRET`
- `PASSWORD_RESET_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `APP_URL`
- `CORS_ORIGIN`

## Frontend Environment Notes
Status: Planned

No dedicated frontend runtime environment schema or `.env` contract exists in `frontend/src`. The frontend configuration currently comes from static config files like `next.config.ts` and `src/config/app-config.ts`.
