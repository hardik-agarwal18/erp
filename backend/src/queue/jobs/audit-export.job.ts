
import { Job } from "bullmq";
import { stringify } from "csv-stringify";
import { AuditExportJobPayload } from "../types.js";
import { mailQueue } from "../queue.service.js";
import logger from "../../config/logger.js";
import { storageService } from "../../lib/storage/storage.service.js";
import prisma from "../../config/database.js";

export const processAuditExportJob = async (job: Job<AuditExportJobPayload>) => {
  logger.info({ jobId: job.id, payload: job.data }, "Generating audit export...");

  const { organizationId, userId, startDate, endDate } = job.data;
  
  // Setup streaming CSV stringifier
  const stringifier = stringify({
    header: true,
    columns: ["id", "actorUserId", "action", "entityType", "entityId", "createdAt", "metadata"],
  });
  
  const chunks: Buffer[] = [];
  stringifier.on('data', (chunk) => {
    chunks.push(Buffer.from(chunk));
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const whereClause: any = { organizationId };
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  let cursor: string | undefined = undefined;
  let hasMore = true;
  const batchSize = 1000;

  try {
    while (hasMore) {
      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        take: batchSize,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { id: 'asc' },
      }) as any[];

      if (logs.length === 0) {
        hasMore = false;
      } else {
        for (const log of logs) {
          stringifier.write([
            log.id,
            log.actorUserId,
            log.action,
            log.entityType,
            log.entityId || "",
            log.createdAt.toISOString(),
            log.metadata ? JSON.stringify(log.metadata) : "",
          ]);
        }
        cursor = logs[logs.length - 1].id;
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to generate audit log records");
    throw error;
  }

  stringifier.end();

  await new Promise((resolve, reject) => {
    stringifier.on('end', resolve);
    stringifier.on('error', reject);
  });

  const buffer = Buffer.concat(chunks);
  const path = `organizations/${organizationId}/exports/audit/audit-logs-${Date.now()}.csv`;
  
  await storageService.uploadFile(path, buffer, "text/csv");
  const url = await storageService.getSignedUrl(path, 7 * 24 * 60 * 60);
  
  logger.info(`Audit export generated and available at ${url}`);
  
  await mailQueue.add("export-email", {
    type: "export",
    payload: {
      to: user.email,
      exportType: "audit-logs",
      downloadUrl: url,
    }
  });
  
  return { status: "COMPLETED", path, url };
};
