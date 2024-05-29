import { mailQueue, pdfGenerationQueue, reportsQueue, auditQueue } from "./queue.service.js";

export type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
};

export type AggregatedQueueMetrics = Record<string, QueueCounts>;

export const getAggregatedQueueMetrics = async (): Promise<AggregatedQueueMetrics> => {
  const [mail, pdf, reports, audit] = await Promise.all([
    mailQueue.getJobCounts("waiting", "active", "completed", "failed"),
    pdfGenerationQueue.getJobCounts("waiting", "active", "completed", "failed"),
    reportsQueue.getJobCounts("waiting", "active", "completed", "failed"),
    auditQueue.getJobCounts("waiting", "active", "completed", "failed"),
  ]);

  return {
    mail: mail as QueueCounts,
    pdf: pdf as QueueCounts,
    reports: reports as QueueCounts,
    audit: audit as QueueCounts,
  };
};
