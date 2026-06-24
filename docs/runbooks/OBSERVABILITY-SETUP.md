# Observability Stack Setup

This runbook documents how to spin up the local observability stack and trace an end-to-end business event through the ERP.

## Components
- **OTEL Collector**: `localhost:4318`
- **Jaeger (Traces UI)**: `localhost:16686`
- **Prometheus (Metrics UI)**: `localhost:9090`
- **Grafana (Dashboards UI)**: `localhost:3001` (admin/admin)

## Startup
```bash
docker-compose -f docker-compose.observability.yml up -d
```

## Validating End-to-End Traces
1. Post a new Sales Invoice to the backend API.
2. Open Jaeger UI (`http://localhost:16686`).
3. Search for Service `erp-backend` and Tag `event.type=SalesInvoicePOSTED`.
4. The trace should show:
   - `HTTP POST /invoices`
   - `db.query` (Outbox Insert)
   - `bullmq.publish`
   - `bullmq.process accountingQueue`
   - `db.query` (Journal Entry Insert)
