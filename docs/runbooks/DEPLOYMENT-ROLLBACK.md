# Enterprise Deployment & Rollback Runbook

**Purpose**: This runbook provides critical procedures for safely reverting enterprise platform infrastructure during a catastrophic deployment failure.

## 1. Prisma Migration Rollback
If a database schema migration causes critical regressions or locking:
1. **Identify Target State**: Find the migration ID prior to the failing deployment.
2. **Execute Down Migration**: 
   Since Prisma does not natively support downward migrations easily, restore the database to the pre-deployment snapshot (taken automatically prior to migration pipelines).
   *Alternative*: Roll forward with a new migration script that manually reverses the schema modifications (`prisma migrate dev --create-only`).

## 2. Queue Worker Rollback
If a new release of a BullMQ worker introduces poison messages into the queue:
1. **Pause Queues**: Immediately pause processing in the Bull Board UI or via CLI to halt the damage.
2. **Revert Image/Container**: Rollback the Node.js container orchestration layer (Kubernetes/ECS) to the previous stable SHA.
3. **Quarantine Messages**: Allow currently executing jobs to finish or fail. Do NOT clear the DLQ.
4. **Unpause & Replay**: Resume the stable workers. Utilize `scripts/dlq-replay.ts` to retry the quarantined messages through the stable logic.

## 3. OpenAPI & SDK Regeneration Rollback
If API contract drift causes the React frontend to crash:
1. **Revert Frontend Commits**: Revert the frontend deployment to the previous stable Git SHA.
2. **Re-run Code Generation**: 
   ```bash
   npm run generate:openapi --workspace=backend
   npm run generate:sdk --workspace=frontend
   ```
3. **Verify Types**: Ensure `@typescript-eslint/no-explicit-any` checks are passing locally before redeploying.

## 4. Audit Middleware & Database Extension Rollback
If Prisma Extensions (Tenant Isolation or Audit Logging) cause severe transaction bottlenecks:
1. **Disable Extensions Locally**: Edit `extensions.ts` to temporarily bypass the `$query` intercepts.
2. **Hotfix Deploy**: Push the bypass to production.
3. **Reconciliation**: Any data created during the bypass period will lack automated `AuditLog` entries. A post-incident script must be authored to backfill these logs via manual inspection.

## 5. Outbox Replay Strategy
If a deployment caused `OutboxEvent` records to be erroneously marked as `FAILED`:
1. Resolve the deployment bug causing the failures.
2. Utilize the `dlq-replay.ts` script to bulk-reset the status back to `PENDING`.
3. Monitor the `accounting-health-dashboard` in Grafana to ensure Replayed Events count spikes and Journal Entries normalize.
