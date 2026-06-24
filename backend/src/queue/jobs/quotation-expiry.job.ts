import prisma from "../../config/database.js";
import logger from "../../config/logger.js";
import { Job } from "bullmq";

export const processQuotationExpiryJob = async (job: Job) => {
  logger.info(`Starting nightly quotation expiry sweep...`);

  try {
    const expiredCount = await prisma.quotationRevision.updateMany({
      where: {
        validUntil: { lt: new Date() },
        status: { notIn: ["ACCEPTED", "REJECTED", "EXPIRED", "SUPERSEDED"] },
        expiresAutomatically: true
      },
      data: {
        status: "EXPIRED"
      }
    });

    logger.info(`Quotation expiry sweep completed. Marked ${expiredCount.count} revisions as EXPIRED.`);
  } catch (error) {
    logger.error({ error }, "Failed to process quotation expiry sweep");
    throw error;
  }
};
