import { Worker } from "bullmq";
import { queueConnection } from "./connection.js";
import { QueueNames, MailJobPayload } from "./types.js";
import { processMailJob } from "./jobs/mail.job.js";
import { processPdfGenerationJob } from "./jobs/pdf.job.js";
import { processCleanupJob } from "./jobs/storage-cleanup.job.js";
import { processReportJob } from "./jobs/report-export.job.js";
import { processAuditExportJob } from "./jobs/audit-export.job.js";
import { queueJobsCompletedTotal, queueJobsFailedTotal } from "../monitoring/metrics.js";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

import { loggerContext } from "../config/logger.js";

const withLoggerContext = (processor: (job: any) => Promise<any>) => {
  return async (job: any) => {
    const dataContext = job.data?._context;
    const store = new Map<string, string>();
    if (dataContext) {
      for (const [key, value] of Object.entries(dataContext)) {
        store.set(key, String(value));
      }
    }
    store.set("jobId", job.id!);
    return loggerContext.run(store, () => processor(job));
  };
};

const workers: Worker[] = [];

export const startWorkers = () => {
  if (!env.QUEUE_ENABLED) {
    logger.info("Queues are disabled via QUEUE_ENABLED=false. Skipping worker startup.");
    return;
  }

  logger.info("Starting background workers...");

  // Helper to attach observability listeners
  const attachWorkerObservability = (worker: Worker, queueName: string) => {
    worker.on("completed", (job) => {
      const durationMs = (job.finishedOn || Date.now()) - (job.processedOn || job.timestamp);
      queueJobsCompletedTotal.labels(queueName).inc();
      logger.info({ queueName, jobId: job.id, duration: durationMs, attemptsMade: job.attemptsMade }, "Job completed");
    });

    worker.on("failed", (job, err) => {
      queueJobsFailedTotal.labels(queueName, err.message).inc();
      logger.error({ queueName, jobId: job?.id, attemptsMade: job?.attemptsMade, failureReason: err.message }, "Job failed");
    });

    worker.on("stalled", (jobId) => {
      logger.warn({ queueName, jobId }, "Job stalled");
    });

    worker.on("progress", (job, progress) => {
      logger.debug({ queueName, jobId: job.id, progress }, "Job progress");
    });

    worker.on("error", (err) => {
      logger.error({ queueName, error: err.message }, "Worker error");
    });

    workers.push(worker);
  };

  const prefix = env.NODE_ENV === "test" ? "{test-bull}" : "{bull}";

  // Mail worker
  const mailWorker = new Worker<MailJobPayload>(QueueNames.MAIL, withLoggerContext(processMailJob), { connection: queueConnection.duplicate() as any, concurrency: 5, prefix });
  attachWorkerObservability(mailWorker, QueueNames.MAIL);

  // PDF Generation Worker
  const pdfWorker = new Worker(QueueNames.PDF_GENERATION, withLoggerContext(processPdfGenerationJob), { connection: queueConnection.duplicate() as any, concurrency: 2, prefix });
  attachWorkerObservability(pdfWorker, QueueNames.PDF_GENERATION);

  // Cleanup Worker
  const cleanupWorker = new Worker(QueueNames.STORAGE_CLEANUP, withLoggerContext(processCleanupJob), { connection: queueConnection.duplicate() as any, concurrency: 1, prefix });
  attachWorkerObservability(cleanupWorker, QueueNames.STORAGE_CLEANUP);

  // Report Worker
  const reportWorker = new Worker(QueueNames.REPORTS, withLoggerContext(processReportJob), { connection: queueConnection.duplicate() as any, concurrency: 2, prefix });
  attachWorkerObservability(reportWorker, QueueNames.REPORTS);

  // Audit Worker
  const auditWorker = new Worker(QueueNames.AUDIT_EXPORTS, withLoggerContext(processAuditExportJob), { connection: queueConnection.duplicate() as any, concurrency: 1, prefix });
  attachWorkerObservability(auditWorker, QueueNames.AUDIT_EXPORTS);
};

export const shutdownWorkers = async () => {
  logger.info("Shutting down background workers gracefully...");
  
  const closePromises = workers.map(async (worker) => {
    await worker.close();
    logger.info(`Worker for ${worker.name} closed.`);
  });

  await Promise.all(closePromises);
  logger.info("All background workers shutdown complete.");
};
