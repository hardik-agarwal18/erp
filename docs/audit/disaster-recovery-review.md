# Disaster Recovery Review
**Audit Phase 9 — Backup, Recovery, Ledger Rebuild, DLQ Replay**
*Generated: 2026-06-17 | Auditor: Platform Reliability Engineer*

---

## Executive Summary

No automated backup strategy, restore procedure, or RPO/RTO definition was found in the codebase or configuration files. The existence of `backup.ts` (700 bytes) and `invoice_backup.json` in the backend root suggests manual, ad-hoc backup operations rather than a systematic DR plan. The Outbox pattern provides some resilience for event processing but DLQ replay is manual and unverified. The `docs/runbooks/` directory exists (the user had `DEPLOYMENT-ROLLBACK.md` open), indicating some operational documentation exists.

---

## 1. Backup Strategy

### Finding 1: No Automated Database Backup Configuration
**Evidence searched:** `docker-compose.yml`, `.env.production`, `scripts/`, `backend/Dockerfile` — no database backup tooling (pg_dump, WAL-G, Barman, AWS RDS automated backups) configured in code.

**Evidence of ad-hoc backup:**
```
File: backend/backup.ts (700 bytes) — manual backup script
File: backend/invoice_backup.json (141KB) — backup committed to repo
File: backend/receipt_backup.json (2 bytes — empty)
```

**Assessment:** The `backup.ts` script appears to be a one-off manual backup tool. There is no evidence of:
- Automated daily/hourly database snapshots
- Point-in-time recovery (PITR) configuration
- Off-site backup storage
- Backup verification/restore testing

**Recommendation:**
1. If on managed PostgreSQL (AWS RDS, Supabase, Neon): Enable automated backups with 7-35 day retention and PITR
2. If self-hosted: Configure WAL-G or pgBackRest with S3 storage, daily full backups, continuous WAL archiving
3. Test restore monthly and document the procedure

**Estimated RPO without changes: HOURS TO DAYS (unacceptable)**  
**Target RPO: 1 hour (PITR enabled)**

---

## 2. Recovery Procedures

### Finding 2: Deployment-Rollback Runbook Exists
**Evidence:** `docs/runbooks/DEPLOYMENT-ROLLBACK.md` is present (currently open in user's editor).  
**Assessment:** POSITIVE — operational runbooks exist. Content not reviewed in this audit phase.

### Finding 3: No Observed Database Recovery Runbook
**UNVERIFIED:** Whether `docs/runbooks/` contains a database restore procedure.

**Required runbooks (to be created):**
1. `DATABASE-RESTORE.md` — Step-by-step PostgreSQL restore from backup
2. `REDIS-RECOVERY.md` — Redis failure handling (sessions, cache, idempotency)
3. `LEDGER-REBUILD.md` — Rebuilding journal entries from outbox events
4. `DLQ-REPLAY.md` — Manual DLQ event replay procedure
5. `INCIDENT-RESPONSE.md` — Escalation and response procedures

---

## 3. Ledger Rebuild Capability

### Finding 4: Journal Entries CAN Be Rebuilt From Outbox Events (Theoretically)

**Evidence:**
```prisma
model OutboxEvent {
  eventType  String
  payload    Json     // contains all data needed to create journal entry
  status     String   // PENDING/PROCESSING/COMPLETED/FAILED/ENQUEUED
  processedAt DateTime?
}
```

Every outbox event carries the full payload needed to create its journal entry. A rebuild procedure would:
1. Find all `COMPLETED` outbox events whose `aggregateId` has no corresponding `JournalEntry.referenceId`
2. Replay those events through the accounting handlers

**BLOCKER:** The `sourceEventId` unique constraint on `JournalEntry` was **removed** from the service layer (comment in accounting.service.ts line 175: "Removed sourceEventId logic"). Without this constraint, replaying events could create duplicate journal entries.

**Recommendation:**
1. Restore `sourceEventId` field propagation in `accountingRepository.createJournalEntry()`
2. The `@@unique([organizationId, sourceEventId])` constraint is still in the schema — it just needs to be used
3. Document the ledger rebuild procedure: reset completed events to PENDING, re-run the relay

---

## 4. DLQ Replay

### Finding 5: DLQ Exists But Manual Replay Is Unverified

**Evidence:**
```typescript
// accounting.job.ts lines 97-100
await accountingDlqQueue.add("accounting-dlq-event", { outboxEventId: event.id }, {
  jobId: `dlq-${event.id}`
});
```

Events exceeding MAX_RETRIES (5) are pushed to the DLQ queue.

**Evidence — BullBoard:**
```typescript
app.use("/api/v1/admin/queues", bullBoardAuth, bullBoardRouter);
```

BullBoard allows manual job retry from the UI. This means DLQ replay is possible via the admin dashboard, but requires manual intervention.

**UNVERIFIED:** Whether `processAccountingDlqJob` (accounting-dlq.job.ts) alerts on receipt or attempts auto-recovery.

**Recommendation:**
1. Document the DLQ replay procedure in `DLQ-REPLAY.md`
2. Add a Prometheus alert when DLQ queue depth > 0
3. Create an admin API endpoint for bulk DLQ replay: `POST /api/v1/admin/accounting-dlq/replay`

---

## 5. Redis Recovery

### Finding 6: Redis Failure Impacts Sessions, Cache, and Idempotency

**Redis is used for:**
1. Refresh session cache (auth)
2. Access token blacklist
3. Application cache (permissions, products, etc.)
4. BullMQ job store (queue state)
5. Idempotency key store

**On Redis failure:**
- Sessions cannot be validated → all authenticated users are logged out
- Cache misses → every request hits the database (degraded performance)
- Idempotency silently disabled (see security review)
- BullMQ stops processing (queue unavailable)

**Evidence — idempotency.middleware.ts:**
```typescript
} catch (error) {
  return next(); // Proceeds without idempotency
}
```

**Evidence — auth.middleware.ts lines 34-37:**
```typescript
const blacklisted = await redisClient.get(`blacklist:${payload.jti}`);
// If Redis is down, this throws → all requests rejected with 401
```

**Assessment:** Redis failure causes a complete authentication outage. The blacklist check is not in a try-catch, so a Redis connection error results in HTTP 401 for all authenticated requests.

**Recommendation:**
1. Configure Redis Sentinel or Redis Cluster for HA
2. Add fallback behavior for blacklist check: if Redis unavailable, accept token (log warning) rather than rejecting all requests
3. Separate Redis instances for BullMQ (critical) and cache (non-critical)

---

## 6. RPO/RTO Estimates

Based on code evidence and absence of documented DR:

| Metric | Current Estimate | Target |
|---|---|---|
| **RPO** (data loss) | Hours to days | 1 hour (PITR) |
| **RTO** (recovery time) | Days (manual process) | 4 hours |
| Accounting RTO | Days (ledger rebuild unverified) | 8 hours |
| Session RTO | Minutes (Redis restart) | 5 minutes |
| Queue RTO | Minutes (BullMQ restart) | 10 minutes |
| Application RTO | Minutes (container restart) | 5 minutes |

---

## 7. Disaster Scenarios & Response

| Scenario | Current State | Gap |
|---|---|---|
| Database corruption | Unknown recovery | No PITR, no runbook |
| Accidental table truncation | backup.ts (manual) | No automated backup |
| Redis total failure | Authentication outage | No HA, no fallback |
| Accounting outbox stuck | BullBoard manual retry | No automated replay |
| Duplicate journal entries | sourceEventId removed | No idempotency guard |
| Server compromise | Unknown | No documented incident response |
| Datacenter outage | Unknown | No multi-region strategy |

---

## 8. Recommendations by Priority

### Immediate (< 1 week)
1. Enable PostgreSQL automated backups with PITR (if on managed DB)
2. Fix Redis blacklist check to not fail-open/fail-closed catastrophically
3. Add `OTLP_ENDPOINT` validation at startup

### Short-term (1-4 weeks)
1. Write `DATABASE-RESTORE.md` and `DLQ-REPLAY.md` runbooks
2. Test backup restore procedure
3. Restore `sourceEventId` to JournalEntry creation to enable ledger rebuild
4. Set up Redis HA (Sentinel or ElastiCache Multi-AZ)

### Medium-term (1-3 months)
1. Implement automated DLQ alerting and replay endpoint
2. Define formal SLOs and RPO/RTO targets
3. Conduct quarterly DR exercises
4. Consider multi-region deployment strategy

---

## 9. Positive Findings

✅ **Outbox pattern provides event durability** — business events survive application crashes  
✅ **OutboxEvent.payload contains full data** — ledger rebuild is theoretically possible  
✅ **BullBoard provides operational visibility** — manual DLQ replay available  
✅ **Runbooks directory exists** — operational documentation culture is present  
✅ **Docker + docker-compose** — containerized deployment enables faster recovery
