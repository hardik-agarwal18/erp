import { Queue, JobsOptions } from "bullmq";
import { queueConnection } from "./connection.js";
import { QueueNames, MailJobPayload, PdfGenerationJobPayload, ReportJobPayload, AuditExportJobPayload } from "./types.js";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: true, // Keep Redis clean
  removeOnFail: false, // Leave failed jobs for dead-letter processing
};

// Queue registry to cleanly shut them down if needed
const queues = new Map<string, Queue>();

export const createQueue = <DataType, ResultType = any, NameType extends string = string>(
  queueName: string,
): Queue<DataType, ResultType, NameType> => {
  const queue = new Queue<DataType, ResultType, NameType>(queueName, {
    connection: queueConnection as any,
    defaultJobOptions,
  });

  queue.on("error", (error) => {
    logger.error({ error, queueName }, "Queue error");
  });

  queues.set(queueName, queue);
  return queue;
};

// Strongly-typed Queue instances
export const mailQueue = createQueue<MailJobPayload>(QueueNames.MAIL);
export const pdfGenerationQueue = createQueue<PdfGenerationJobPayload>(QueueNames.PDF_GENERATION);
export const cleanupQueue = createQueue(QueueNames.STORAGE_CLEANUP);
export const reportsQueue = createQueue<ReportJobPayload>(QueueNames.REPORTS);
export const auditQueue = createQueue<AuditExportJobPayload>(QueueNames.AUDIT_EXPORTS);

export const closeQueues = async () => {
  for (const [name, queue] of queues.entries()) {
    try {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    } catch (error) {
      logger.error({ error, queueName: name }, "Error closing queue");
    }
  }
};
