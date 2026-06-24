
import { Job, Queue } from "bullmq";
import PDFDocument from "pdfkit";
import { PdfGenerationJobPayload, QueueNames } from "../types.js";
import { invoiceRepository } from "../../domains/financials/invoices/invoice.repository.js";
import { storageService } from "../../lib/storage/storage.service.js";
import logger from "../../config/logger.js";
import { mailQueue } from "../queue.service.js";

export const processPdfGenerationJob = async (job: Job<PdfGenerationJobPayload>) => {
  const { documentId, documentType, organizationId } = job.data;
  logger.info({ jobId: job.id, documentId, documentType }, "Starting PDF generation");

  if (documentType !== "INVOICE") {
    throw new Error(`Document type ${documentType} not supported yet`);
  }

  const invoice = await invoiceRepository.findById(organizationId, documentId);
  if (!invoice) {
    throw new Error(`Invoice ${documentId} not found`);
  }

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Issue Date: ${invoice.issueDate.toDateString()}`);
    doc.moveDown();
    
    doc.text(`Customer: ${invoice.customer?.name || "Unknown"}`);
    
    doc.moveDown();
    doc.text("Items:");
    invoice.items.forEach(item => {
      doc.text(`- ${item.product.name} x${item.quantity}: $${item.lineTotal}`);
    });
    
    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: $${invoice.totalAmount}`, { align: "right" });
    
    doc.end();
  });

  const storagePath = `organizations/${organizationId}/invoices/${invoice.invoiceNumber}.pdf`;
  await storageService.uploadFile(storagePath, pdfBuffer, "application/pdf");
  
  logger.info({ storagePath }, "PDF stored successfully");

  const targetEmail = job.data.targetEmail;
  if (targetEmail) {
    const signedUrl = await storageService.getSignedUrl(storagePath);
    
    await mailQueue.add("invoice-email", {
      type: "invoice",
      payload: {
        to: targetEmail,
        invoiceNumber: invoice.invoiceNumber,
        downloadUrl: signedUrl
      }
    });

    if (job.data.emailLogId) {
      const prisma = (await import("../../config/database.js")).default;
      await prisma.invoiceEmailLog.update({
        where: { id: job.data.emailLogId },
        data: { status: "SENT", sentAt: new Date() },
      }).catch(err => logger.error({ err, emailLogId: job.data.emailLogId }, "Failed to update email log"));
    }
  }

  return { storagePath };
};
