# Enterprise Service Level Objectives (SLOs)

These SLOs define the acceptable boundaries for the ERP platform in production. An alert must be triggered if any of these SLOs approach their error budget.

## 1. Accounting Reliability
**SLI**: Percentage of Financial Workflows (Sales Invoices, GRNs, Payroll) that successfully produce corresponding `JournalEntry` records.
**SLO**: `99.99%` (Accounting Correctness)
**Error Budget Response**: If dropped journals exceed 0.01%, pause affected upstream mutations immediately.

## 2. Event Idempotency
**SLI**: Duplicate Journal Entries created for the same `OutboxEvent` ID.
**SLO**: `0` (Absolute Correctness)
**Error Budget Response**: Immediate P1 incident. The idempotency guardrails must never fail.

## 3. Queue Processing (Outbox & Workers)
**SLI**: Percentage of messages successfully processed from the Outbox without hitting the DLQ.
**SLO**: `99.9%`
**Error Budget Response**: If DLQ rate > 0.1%, initiate automated scale-out of workers and review network/database latency.

## 4. API Responsiveness
**SLI**: P95 latency of successful HTTP API requests across the platform.
**SLO**: `< 500ms`
**Error Budget Response**: High latency impacts user experience and increases database connection pool pressure. Profile N+1 queries.
