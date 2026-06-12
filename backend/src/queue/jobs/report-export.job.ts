
import { Job } from "bullmq";
import { stringify } from "csv-stringify";
import { ReportJobPayload } from "../types.js";
import { mailQueue } from "../queue.service.js";
import logger from "../../config/logger.js";
import { storageService } from "../../lib/storage/storage.service.js";
import prisma from "../../config/database.js";

export const processReportJob = async (job: Job<ReportJobPayload>) => {
  logger.info({ jobId: job.id, payload: job.data }, "Generating report export...");

  const { organizationId, reportType, userId, startDate, endDate, frequency } = job.data;
  
  const isAggregated = frequency && frequency !== "raw";
  
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const aggregations = new Map<string, any>();

  const getBucketKey = (date: Date, freq: string) => {
    if (freq === "monthly") return date.toISOString().slice(0, 7);
    if (freq === "weekly") {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
    }
    return date.toISOString().split('T')[0];
  };
  
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
          where: { 
            organizationId, 
            ...(hasDateFilter ? { issueDate: dateFilter } : {}) 
          },
          take: batchSize,
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
          orderBy: { id: 'asc' },
          include: { customer: { select: { name: true } } }
        }) as any[];

        if (invoices.length === 0) {
          hasMore = false;
        } else {
          for (const inv of invoices) {
            if (isAggregated) {
              const key = getBucketKey(inv.issueDate, frequency!);
              if (!aggregations.has(key)) {
                aggregations.set(key, { count: 0, subtotal: 0, tax: 0, discount: 0, total: 0 });
              }
              const agg = aggregations.get(key);
              agg.count += 1;
              agg.subtotal += Number(inv.subtotal);
              agg.tax += Number(inv.taxAmount);
              agg.discount += Number(inv.discountAmount);
              agg.total += Number(inv.totalAmount);
            } else {
              stringifier.write({ 
                "Invoice Number": inv.invoiceNumber, 
                "Customer Name": inv.customer.name,
                "Status": inv.status, 
                "Issue Date": inv.issueDate.toISOString().split('T')[0], 
                "Due Date": inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : "",
                "Subtotal": inv.subtotal.toString(),
                "Tax Amount": inv.taxAmount.toString(),
                "Discount": inv.discountAmount.toString(),
                "Total Amount": inv.totalAmount.toString()
              });
            }
          }
          cursor = invoices[invoices.length - 1].id;
        }
      } else if (reportType === "expense") {
        const expenses = await prisma.expense.findMany({
          where: { 
            organizationId,
            ...(hasDateFilter ? { expenseDate: dateFilter } : {})
          },
          take: batchSize,
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
          orderBy: { id: 'asc' },
          include: { vendor: { select: { name: true } } }
        }) as any[];

        if (expenses.length === 0) {
          hasMore = false;
        } else {
          for (const exp of expenses) {
            if (isAggregated) {
              const key = getBucketKey(exp.expenseDate, frequency!);
              if (!aggregations.has(key)) {
                aggregations.set(key, { count: 0, amount: 0 });
              }
              const agg = aggregations.get(key);
              agg.count += 1;
              agg.amount += Number(exp.amount);
            } else {
              stringifier.write({ 
                "Date": exp.expenseDate.toISOString().split('T')[0],
                "Category": exp.category, 
                "Vendor Name": exp.vendor?.name || "N/A",
                "Amount": exp.amount.toString(), 
                "Description": exp.description || ""
              });
            }
          }
          cursor = expenses[expenses.length - 1].id;
        }
      } else if (reportType === "inventory") {
        const inventory = await prisma.inventoryItem.findMany({
          where: { organizationId },
          take: batchSize,
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
          orderBy: { id: 'asc' },
          include: { product: { select: { name: true, sku: true, sellingPrice: true, type: true } } }
        }) as any[];

        if (inventory.length === 0) {
          hasMore = false;
        } else {
          for (const item of inventory) {
            stringifier.write({ 
              "SKU": item.product.sku || "N/A",
              "Product Name": item.product.name,
              "Type": item.product.type,
              "Quantity in Stock": item.quantity.toString(), 
              "Reorder Level": item.reorderLevel?.toString() || "N/A",
              "Unit Price": item.product.sellingPrice.toString(),
            });
          }
          cursor = inventory[inventory.length - 1].id;
        }
      } else if (reportType === "tax") {
        const taxes = await prisma.tax.findMany({
          where: { organizationId },
          take: batchSize,
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
          orderBy: { id: 'asc' },
        }) as any[];

        if (taxes.length === 0) {
          hasMore = false;
        } else {
          for (const tax of taxes) {
            stringifier.write({ 
              "Tax Name": tax.name,
              "Type": tax.type,
              "Rate (%)": tax.rate.toString(),
              "Is Default": tax.isDefault ? "Yes" : "No"
            });
          }
          cursor = taxes[taxes.length - 1].id;
        }
      } else {
        // Fallback for unknown reports
        stringifier.write({ "Error": `Unknown report type: ${reportType}` });
        hasMore = false;
      }
    }

    if (isAggregated) {
      const sortedKeys = Array.from(aggregations.keys()).sort();
      for (const key of sortedKeys) {
        if (reportType === "sales") {
          const agg = aggregations.get(key);
          stringifier.write({
            "Period": key,
            "Total Invoices": agg.count.toString(),
            "Subtotal": agg.subtotal.toFixed(2),
            "Tax Amount": agg.tax.toFixed(2),
            "Discount": agg.discount.toFixed(2),
            "Total Amount": agg.total.toFixed(2)
          });
        } else if (reportType === "expense") {
          const agg = aggregations.get(key);
          stringifier.write({
            "Period": key,
            "Total Transactions": agg.count.toString(),
            "Total Amount": agg.amount.toFixed(2)
          });
        }
      }
    }

  } catch (error) {
    logger.error({ error }, "Failed to generate report records");
    throw error;
  }

  // Wait for stringifier to finish
  const streamPromise = new Promise((resolve, reject) => {
    stringifier.on('end', resolve);
    stringifier.on('error', reject);
  });

  stringifier.end();

  await streamPromise;

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
