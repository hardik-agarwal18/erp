import { Prisma, PrismaClient } from "@prisma/client";
import { OutboxStatus } from "../../queue/jobs/accounting.job.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Service to handle transactional outbox publishing.
 */
export const outboxService = {
  /**
   * Publishes an event to the outbox table within the given Prisma transaction.
   */
  publishEvent: async (
    tx: Prisma.TransactionClient,
    organizationId: string,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    eventVersion: number,
    payload: any,
    correlationId?: string,
    causationId?: string
  ) => {
    return (tx as any).outboxEvent.create({
      data: {
        id: uuidv4(),
        organizationId,
        aggregateType,
        aggregateId,
        eventType,
        eventVersion,
        payload,
        status: OutboxStatus.PENDING,
        correlationId,
        causationId,
      },
    });
  },
};

