# Disaster Recovery: Ledger Rebuild

**Severity**: CRITICAL 🚨
**Approval Required**: CTO / VP Engineering

If mathematical inconsistency is detected between the Operational Outbox and the Financial Ledger, and `validate-ledger.ts` detects widespread anomalies that cannot be surgically repaired, a full rebuild may be necessary.

## Procedure
1. Halt all incoming traffic (Enable Maintenance Mode).
2. Validate environment: Ensure you are connected to the correct database.
3. Run `npx tsx scripts/validate-ledger.ts` to output the exact discrepancy count.
4. Execute the rebuild script:
   ```bash
   REBUILD_LEDGER=true NODE_ENV=staging npx tsx scripts/rebuild-ledger.ts
   ```
5. Follow the interactive prompts. The script will automatically trigger a `pg_dump` backup.
6. Once the script resets the Outbox to `PENDING`, monitor the `accountingQueue` in Grafana.
7. Run `validate-ledger.ts` again to certify mathematical correctness before disabling Maintenance Mode.
