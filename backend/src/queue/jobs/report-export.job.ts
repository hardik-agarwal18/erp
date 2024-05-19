import { Job } from "bullmq";
import { stringify } from "csv-stringify";
import { ReportJobPayload } from "../types.js";
import { mailQueue } from "../queue.service.js";
import logger from "../../config/logger.js";
import { storageService } from "../../lib/storage/storage.service.js";
import prisma from "../../config/database.js";

export const processReportJob = async (job: Job<ReportJobPayload>) => {
  logger.info({ jobId: job.id, payload: job.data }, "Generating report export...");

  const { organizationId, reportType, userId } = job.data;
  
  // Create a stringifier
  const stringifier = stringify({ header: true });
  const chunks: Buffer[] = [];
  
  stringifier.on('data', (chunk) => {
    chunks.push(Buffer.from(chunk));
  });

  // Fetch the user email
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Generate data based on report type
  // Note: For massive datasets we would use cursor pagination here
  // simulating a streamed response by chunking queries
  try {
    let cursor: string | undefined = undefined;
    let hasMore = true;
    const batchSize = 1000;

    while (hasMore) {
      if (reportType === "sales") {
        const invoices = await prisma.invoice.findMany({
          where: { organizationId },
          take: batchSize,
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
          orderBy: { id: 'asc' },
          select: { id: true, invoiceNumber: true, status: true, totalAmount: true, issueDate: true }
        }) as any[];

        if (invoices.length === 0) {
          hasMore = false;
        } else {
          for (const inv of invoices) {
            stringifier.write({ 
              id: inv.id, 
              invoiceNumber: inv.invoiceNumber, 
              status: inv.status, 
              total: inv.totalAmount.toString(),
              issueDate: inv.issueDate.toISOString() 
            });
          }
          cursor = invoices[invoices.length - 1].id;
        }
      } else if (reportType === "expense") {
        const expenses = await prisma.expense.findMany({
          where: { organizationId },
          take: batchSize,
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
          orderBy: { id: 'asc' },
          select: { id: true, amount: true, category: true, expenseDate: true }
        }) as any[];

        if (expenses.length === 0) {
          hasMore = false;
        } else {
          for (const exp of expenses) {
            stringifier.write({ 
              id: exp.id, 
              amount: exp.amount.toString(), 
              status: exp.category, 
              date: exp.expenseDate.toISOString() 
            });
          }
          cursor = expenses[expenses.length - 1].id;
        }
      } else {
        // Fallback for inventory/tax reports for now
        stringifier.write({ id: "1", type: reportType, status: "mocked" });
        hasMore = false;
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to generate report records");
    throw error;
  }

  stringifier.end();

  // Wait for stringifier to finish
  await new Promise((resolve, reject) => {
    stringifier.on('end', resolve);
    stringifier.on('error', reject);
  });

  const buffer = Buffer.concat(chunks);
  const path = `organizations/${organizationId}/exports/reports/${reportType}-${Date.now()}.csv`;
  
  await storageService.uploadFile(path, buffer, "text/csv");
  const url = await storageService.getSignedUrl(path, 7 * 24 * 60 * 60); // 7 days expiration
  
  logger.info(`Report generated and available at ${url}`);
  
  // Enqueue email job
  await mailQueue.add("export-email", {
    type: "export",
    payload: {
      to: user.email,
      exportType: reportType,
      downloadUrl: url,
    }
  });
  
  return { status: "COMPLETED", path, url };
};
