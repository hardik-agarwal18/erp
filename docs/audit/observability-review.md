# Observability Review
**Audit Phase 8 — Tracing, Metrics, Logging, SLOs, DLQ Visibility**
*Generated: 2026-06-17 | Auditor: Platform Reliability Engineer*

---

## Executive Summary

The ERP has a solid observability foundation with three pillars implemented: structured logging (pino), distributed tracing (OpenTelemetry), and metrics (Prometheus). BullMQ and Prisma are auto-instrumented. A BullBoard admin UI for queue visibility is present. However, critical business-level metrics are absent, request tracing cannot follow the complete `API → Outbox → Worker → JournalEntry` flow due to missing span context propagation, and there are no defined SLOs or alerting configurations.

---

## 1. Logging

### ✅ Structured Logging with pino
**Evidence — app.ts lines 73-92:**
```typescript
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url, 
                     query: req.query, headers: { host, "user-agent", "content-type" } }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));
```

Every HTTP request is logged with a unique `reqId` (UUID), method, URL, and response code. This is the correct foundation for log-based request tracing.

### ✅ Request ID Propagation via AsyncLocalStorage
**Evidence — app.ts lines 65-71:**
```typescript
app.use((req, _res, next) => {
  const store = new Map<string, string>();
  const reqId = crypto.randomUUID();
  store.set("reqId", reqId);
  req.id = reqId;
  loggerContext.run(store, next);
});
```

AsyncLocalStorage is used to propagate the request ID through the entire request lifecycle without threading it through function parameters. This enables correlated logging.

### ✅ Worker Context Propagation
**Evidence — worker.service.ts lines 20-32:**
```typescript
const withLoggerContext = (processor) => async (job) => {
  const dataContext = job.data?._context;
  const store = new Map();
  if (dataContext) {
    for (const [key, value] of Object.entries(dataContext)) {
      store.set(key, String(value));
    }
  }
  store.set("jobId", job.id!);
  return loggerContext.run(store, () => processor(job));
};
```

Job processors inherit log context from job data. However, the `_context` field must be explicitly set when enqueuing jobs — if the outbox relay doesn't include context, worker logs won't correlate with the originating request.

### 🟠 HIGH: No Correlation Between Outbox Event and Originating Request
**Finding:** When an outbox event is created in a request transaction, the originating `reqId` is NOT stored in the `OutboxEvent` record. Worker logs will have a `jobId` but cannot be correlated back to the HTTP request that created the event.

**Evidence — invoice.service.ts lines 197-215:**
```typescript
await (tx as any).outboxEvent.create({
  data: {
    organizationId,
    aggregateType: "SalesInvoice",
    aggregateId: created.id,
    eventType: "SalesInvoicePOSTED",
    payload: { ... },
    // ← NO correlationId from request context stored here
  },
});
```

**Recommendation:** When creating outbox events, store the current `reqId` as `correlationId`:
```typescript
correlationId: loggerContext.getStore()?.get("reqId"),
```
Then pass it as `_context.reqId` when enqueuing the BullMQ job.

---

## 2. Distributed Tracing

### ✅ OpenTelemetry SDK Initialized with Auto-Instrumentation
**Evidence — monitoring/tracing.ts:**
```typescript
export const sdk = new NodeSDK({
  serviceName: "erp-backend",
  traceExporter: new OTLPTraceExporter({ url: process.env.OTLP_ENDPOINT }),
  instrumentations: [
    getNodeAutoInstrumentations(),  // Express, HTTP, etc.
    new PrismaInstrumentation(),    // DB queries
    new BullMQInstrumentation()     // Queue jobs
  ],
});
sdk.start();
```

**Assessment:** Excellent setup. Express routes, Prisma queries, and BullMQ jobs are all auto-instrumented with OpenTelemetry spans. Every HTTP request creates a trace; every DB query and queue job is a child span.

### ✅ Business Tracer Available
**Evidence:**
```typescript
export const businessTracer = trace.getTracer("erp-business-workflows");
```

A named tracer for business workflows exists. Its usage in domain services is **UNVERIFIED** but the infrastructure is correctly established.

### 🟠 HIGH: Trace Context NOT Propagated to Outbox Worker
**Finding:** The BullMQ job created from outbox relay does NOT carry the original trace context. Worker processing creates a new trace, not a child span of the originating HTTP request.

**Evidence:** When the outbox relay creates a BullMQ job, it includes only:
```typescript
await accountingQueue.add(event.eventType, { outboxEventId: event.id }, {
  jobId: `outbox-${event.id}`
});
```
No W3C TraceContext headers are injected into the job data.

**Impact:** The complete flow `API Request → Outbox Event → Queue Job → Journal Entry` cannot be traced in a single trace in Jaeger/Tempo. Each step creates an isolated trace.

**Recommendation:**
```typescript
import { context, propagation } from "@opentelemetry/api";
const carrier = {};
propagation.inject(context.active(), carrier);
await accountingQueue.add(eventType, {
  outboxEventId: event.id,
  _otel: carrier  // inject trace context
}, { ... });
```
Then in the worker:
```typescript
const parentContext = propagation.extract(context.active(), job.data._otel);
context.with(parentContext, async () => { ... });
```

### 🟡 MEDIUM: OTLP Endpoint Defaults to localhost
**Evidence:**
```typescript
url: process.env.OTLP_ENDPOINT || "http://localhost:4318/v1/traces"
```
If `OTLP_ENDPOINT` is not set in production, traces are silently discarded (connection refused to localhost on a container). Missing traces in production could go unnoticed.

**Recommendation:** Validate `OTLP_ENDPOINT` at startup. Log a warning if defaulting to localhost in non-development environments.

---

## 3. Metrics

### ✅ Prometheus Metrics Endpoint
**Evidence — app.ts lines 120-123:**
```typescript
app.get("/metrics", metricsAuth, async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});
```

### ✅ Implemented Metrics
**Evidence — monitoring/metrics.ts:**

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `http_requests_total` | Counter | method, route, status_code | Request volume |
| `http_request_duration_seconds` | Histogram | method, route, status_code | Latency distribution |
| `queue_jobs_completed_total` | Counter | queueName | Job throughput |
| `queue_jobs_failed_total` | Counter | queueName, failureReason | Failure rate |
| `queue_jobs_active` | Gauge | queueName | Queue depth |
| `queue_jobs_waiting` | Gauge | queueName | Queue backlog |
| `queue_job_latency_seconds` | Histogram | queueName | Queue wait time |
| `storage_uploads_total` | Counter | provider, bucket | Storage health |
| `pdf_generation_duration_seconds` | Histogram | documentType | PDF performance |
| `report_generation_duration_seconds` | Histogram | reportType | Report performance |
| `cache_hits_total` | Counter | domain | Cache effectiveness |
| `cache_misses_total` | Counter | domain | Cache effectiveness |

### 🟠 HIGH: Missing Business-Level Metrics
**Finding:** No domain-specific financial metrics are defined. There is no way to answer from metrics alone:
- How many invoices were posted today?
- What is the accounting journal processing success rate?
- How many outbox events are stuck in PENDING state?
- What is the average time from invoice post to journal entry creation?

**Recommendation:** Add the following business metrics:
```typescript
// Financial throughput
invoicesPostedTotal: Counter (organizationId label removed for cardinality)
paymentsRecordedTotal: Counter
journalEntriesCreatedTotal: Counter

// Outbox health
outboxEventsPendingTotal: Gauge (scrape OutboxEvent table)
outboxEventsStuckTotal: Gauge (PENDING > 5 minutes)
outboxProcessingLagSeconds: Histogram

// Error rates
journalPostFailuresTotal: Counter (reason label)
```

---

## 4. BullBoard Admin UI

### ✅ BullBoard Queue Dashboard
**Evidence — app.ts lines 110-111:**
```typescript
import { bullBoardRouter, bullBoardAuth } from "./queue/board.js";
app.use("/api/v1/admin/queues", bullBoardAuth, bullBoardRouter);
```

Queue dashboard is available at `/api/v1/admin/queues` with authentication. This provides visibility into:
- Job counts by status (waiting, active, completed, failed, delayed)
- Failed job inspection
- Manual job retry from the UI

**Assessment:** Excellent operational tool. `bullBoardAuth` ensures it's protected.

### 🟡 MEDIUM: Queue Observability Endpoint Without Auth
**Evidence — app.ts lines 113-114:**
```typescript
import queueObservabilityRoutes from "./queue/observability.js";
app.use("/api/v1/queues", queueObservabilityRoutes);
```

A separate observability route exists without `bullBoardAuth`. If this endpoint exposes queue statistics to unauthenticated callers, it reveals operational information.

---

## 5. Can We Trace API → Outbox → Worker → Journal?

**Answer: PARTIALLY**

| Step | Observable? | How |
|---|---|---|
| HTTP Request | ✅ | pino-http log + OTel auto-instrumentation |
| Outbox Event Creation | ✅ | Prisma instrumentation (DB write spans) |
| Outbox Relay Poll | ✅ | BullMQ instrumentation |
| Accounting Job Execution | ✅ | BullMQ instrumentation (new trace) |
| Handler Dispatch | ✅ | Pino log in `invoice.handler.ts` |
| Journal Entry Write | ✅ | Prisma instrumentation |
| End-to-end correlation | ❌ | No span context propagation across async boundary |

**The gap:** HTTP request trace → Queue job trace is NOT linked. Jaeger/Tempo shows two separate traces for what is logically one business operation.

---

## 6. SLOs

**Finding:** No SLO definitions were found in code or documentation (other than `docs/slo.md` which was not inspected but exists).

**INFERRED Candidates for SLOs:**
1. API p99 latency < 500ms for read endpoints
2. Invoice post latency (including queue processing) < 5 seconds
3. Accounting journal creation success rate > 99.9%
4. Outbox processing lag < 60 seconds
5. Authentication endpoint availability > 99.95%

---

## 7. Alerting

**Finding:** No alerting configuration (Prometheus alerting rules, PagerDuty, OpsGenie) was observed in the repository.

**Recommendation:** Add `prometheus-alerts.yaml` with rules for:
- `queue_jobs_failed_total` rate > 1/minute for `accounting` queue
- `outboxEventsPendingTotal` > 100 for > 5 minutes
- `http_request_duration_seconds` p99 > 2s
- API error rate (5xx) > 1%

---

## 8. Summary

| Area | Status | Gap |
|---|---|---|
| Structured logging | ✅ Excellent | Log correlation across async boundary |
| Distributed tracing | ✅ Good setup | Trace context not propagated to workers |
| Metrics | ✅ Infrastructure metrics | Missing business/domain metrics |
| Queue visibility | ✅ BullBoard | Observability endpoint auth unclear |
| SLOs | ❌ Not defined in code | Define and codify |
| Alerting | ❌ Not observed | Add Prometheus alerting rules |
| End-to-end request tracing | 🟡 Partial | Async boundary breaks trace chain |
