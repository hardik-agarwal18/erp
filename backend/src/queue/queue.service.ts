
import { Queue, JobsOptions } from "bullmq";
import { queueConnection } from "./connection.js";
import { QueueNames, MailJobPayload, PdfGenerationJobPayload, ReportJobPayload, AuditExportJobPayload } from "./types.js";
import logger, { loggerContext } from "../config/logger.js";
import { env } from "../config/env.js";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: { age: 3600 }, // Keep in Redis for 1 hour so status endpoints work
  removeOnFail: false, // Leave failed jobs for dead-letter processing
};

// Queue registry to cleanly shut them down if needed
const queues = new Map<string, Queue>();

export const createQueue = <DataType, ResultType = any, NameType extends string = string>(
  queueName: string,
): Queue<DataType, ResultType, NameType> => {
  const queue = new Queue<DataType, ResultType, NameType>(queueName, {
    connection: queueConnection.duplicate() as any,
    defaultJobOptions,
    prefix: env.NODE_ENV === "test" ? "{test-bull}" : "{bull}",
  });

  queue.on("error", (error) => {
    logger.error({ error, queueName }, "Queue error");
  });

  const originalAdd = queue.add.bind(queue);
  queue.add = (async (name: any, data: any, opts?: any) => {
    const store = loggerContext.getStore();
    if (store) {
      const _context = Object.fromEntries(store.entries());
      data = { ...data, _context };
    }
    return originalAdd(name, data, opts);
  }) as any;

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
