# Scale & Performance Validation

## Executive Summary
This document establishes the theoretical and tested capacity limits of the ERP architecture, ensuring that it can natively support high-volume Enterprise SaaS scale without requiring an immediate distributed system rewrite.

## Scope
Target scale parameters:
- **1,000** Organizations
- **100,000** Users
- **10,000,000** Invoices
- **50,000,000** Journal Entries
- **100,000,000** Inventory Movements

## Methodology
Load validation utilized `autocannon` within `scripts/load-test.ts`, focusing on connection pool saturation and CPU processing of background BullMQ jobs. High-volume projections rely on Database schema inspection (indexes).

## Evidence

### ✓ Proven (Tested via Code & CI)
- **Queue Throughput**: Verified. Node.js `BullMQ` workers handled simulated event spikes cleanly via built-in concurrency controls. Connection pools did not exhaust.

### Inferred (Architectural Review)
- **50M+ Journal Entries**: Expected to support seamlessly. The schema leverages strict `B-Tree` indexing on `referenceId` and `organizationId`, preventing full-table scans. Because accounting entries are *append-only* (Phase 1), MVCC vacuuming overhead on Postgres remains low.
- **1,000+ Tenants**: Expected to support natively. Tenant IDs are fully normalized and injected via index-backed queries in `extensions.ts`.

## Limitations
- True horizontal scaling of Node.js instances requires a centralized Redis/Valkey cluster, which was not benchmarked against a distributed infrastructure.

## Residual Risks
- Extensive pagination `OFFSET` across 10M+ invoices will eventually degrade performance. We must transition to cursor-based pagination before hitting 5M+ row tables.

## Sign-Off
**Status**: INFERRED-READY (Requires Cloud Benchmark)
**Validation Phase**: Phase 5
