import client from "prom-client";
import { registry } from "./registry.js";

// HTTP Metrics
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

// Queue Metrics
export const queueJobsCompletedTotal = new client.Counter({
  name: "queue_jobs_completed_total",
  help: "Total number of completed BullMQ jobs",
  labelNames: ["queueName"],
  registers: [registry],
});

export const queueJobsFailedTotal = new client.Counter({
  name: "queue_jobs_failed_total",
  help: "Total number of failed BullMQ jobs",
  labelNames: ["queueName", "failureReason"],
  registers: [registry],
});

export const queueJobsActive = new client.Gauge({
  name: "queue_jobs_active",
  help: "Number of active jobs in queue",
  labelNames: ["queueName"],
  registers: [registry],
});

export const queueJobsWaiting = new client.Gauge({
  name: "queue_jobs_waiting",
  help: "Number of waiting jobs in queue",
  labelNames: ["queueName"],
  registers: [registry],
});

// Storage Metrics
export const storageUploadsTotal = new client.Counter({
  name: "storage_uploads_total",
  help: "Total number of successful storage uploads",
  labelNames: ["provider", "bucket"],
  registers: [registry],
});

export const storageUploadFailuresTotal = new client.Counter({
  name: "storage_upload_failures_total",
  help: "Total number of failed storage uploads",
  labelNames: ["provider", "bucket"],
  registers: [registry],
});

// Duration Metrics
export const pdfGenerationDurationSeconds = new client.Histogram({
  name: "pdf_generation_duration_seconds",
  help: "Time taken to generate PDF artifacts",
  labelNames: ["documentType"],
  registers: [registry],
});

export const reportGenerationDurationSeconds = new client.Histogram({
  name: "report_generation_duration_seconds",
  help: "Time taken to generate report exports",
  labelNames: ["reportType"],
  registers: [registry],
});
