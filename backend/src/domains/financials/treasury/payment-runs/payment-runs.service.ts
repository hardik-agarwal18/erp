import ApiError from "../../../../utils/ApiError.js";
import prisma from "../../../../config/database.js";
import { PaymentBatchStatus, VendorPaymentStatus, PaymentMethod } from "@prisma/client";
import { approvalsService } from "../../../core/approvals/approvals.service.js";
import { vendorPaymentsService } from "../../purchasing/vendor-payments/vendor-payments.service.js";
import { eventBus } from "../../../../shared/events/event-bus.js";
import { treasuryService } from "../treasury.service.js";

// Listen to override approvals
eventBus.on("approval.completed", async (event) => {
  if (event.entityType === "PAYMENT_BATCH") {
    console.log(`[EventBus] PAYMENT_BATCH ${event.entityId} approved`);
    await paymentRunsService.approvePaymentBatch(event.organizationId, event.entityId);
  }
});

eventBus.on("approval.rejected", async (event) => {
  if (event.entityType === "PAYMENT_BATCH") {
    const batch = await prisma.paymentBatch.findUnique({ where: { id: event.entityId } });
    if (batch && batch.status === PaymentBatchStatus.PENDING_APPROVAL) {
      await prisma.paymentBatch.update({
         where: { id: batch.id },
         data: { status: PaymentBatchStatus.CANCELLED }
      });
    }
  }
});

export const paymentRunsService = {
  createPaymentBatch: async (organizationId: string, actorUserId: string, payload: {
    bankAccountId: string;
    scheduledDate: Date | string;
    items: { invoiceId: string, amount: number }[];
  }) => {
    return prisma.$transaction(async (tx) => {
      // Validate items
      let totalAmount = 0;
      const vendorIds = new Set<string>();
      
      for (const item of payload.items) {
         const invoice = await tx.vendorInvoice.findFirst({
            where: { id: item.invoiceId, organizationId }
         });
         if (!invoice) throw new ApiError(404, `Invoice ${item.invoiceId} not found`);
         vendorIds.add(invoice.vendorId);
         totalAmount += item.amount;
      }

      const totalInvoices = payload.items.length;
      const totalVendors = vendorIds.size;
      const batchNumber = `PB-${Date.now()}`;

      const batch = await tx.paymentBatch.create({
        data: {
          organizationId,
          batchNumber,
          bankAccountId: payload.bankAccountId,
          scheduledDate: new Date(payload.scheduledDate),
          status: PaymentBatchStatus.DRAFT,
          totalAmount,
          totalInvoices,
          totalVendors,
          items: {
              create: payload.items.map(item => ({
                 invoiceId: item.invoiceId,
                 vendorId: Array.from(vendorIds)[0], // Hack: we need to find the specific vendorId for the invoice
                 amount: item.amount
              }))
          }
        }
      });

      // Fix the vendorId for items
      for (const item of payload.items) {
         const invoice = await tx.vendorInvoice.findUnique({ where: { id: item.invoiceId } });
         if (invoice) {
            await tx.paymentBatchItem.updateMany({
               where: { paymentBatchId: batch.id, invoiceId: item.invoiceId },
               data: { vendorId: invoice.vendorId, amount: item.amount }
            });
         }
      }

      return batch;
    });
  },

  submitForApproval: async (organizationId: string, actorUserId: string, batchId: string) => {
    const batch = await prisma.paymentBatch.findFirst({ where: { id: batchId, organizationId } });
    if (!batch) throw new ApiError(404, "Payment Batch not found");
    if (batch.status !== PaymentBatchStatus.DRAFT) throw new ApiError(400, "Only DRAFT batches can be submitted");

    await prisma.paymentBatch.update({
       where: { id: batchId },
       data: { status: PaymentBatchStatus.PENDING_APPROVAL }
    });

    await approvalsService.submitForApproval(organizationId, "PAYMENT_BATCH", batchId, actorUserId);
    return { success: true, status: PaymentBatchStatus.PENDING_APPROVAL };
  },

  approvePaymentBatch: async (organizationId: string, batchId: string) => {
    return prisma.paymentBatch.update({
       where: { id: batchId, organizationId },
       data: { status: PaymentBatchStatus.APPROVED }
    });
  },

  executePaymentBatch: async (organizationId: string, actorUserId: string, batchId: string) => {
    const batch = await prisma.paymentBatch.findFirst({
       where: { id: batchId, organizationId },
       include: { items: { include: { vendor: true, invoice: true } }, bankAccount: true }
    });
    if (!batch) throw new ApiError(404, "Payment Batch not found");
    if (batch.status !== PaymentBatchStatus.APPROVED) throw new ApiError(400, "Only APPROVED batches can be executed");

    await prisma.paymentBatch.update({
       where: { id: batch.id },
       data: { status: PaymentBatchStatus.EXECUTING }
    });

    const execution = await prisma.paymentBatchExecution.create({
       data: {
          batchId: batch.id,
          status: "IN_PROGRESS"
       }
    });

    let successCount = 0;
    let failureCount = 0;

    for (const item of batch.items) {
       try {
          // Create Payment via VendorPaymentsService (which creates VendorPayment)
          const payment = await vendorPaymentsService.createPayment(organizationId, actorUserId, {
             vendorId: item.vendorId,
             amount: Number(item.amount),
             paymentMethod: PaymentMethod.BANK_TRANSFER,
             paymentDate: new Date(),
             reference: batch.batchNumber,
             bankAccountId: batch.bankAccountId
          });

          // Create the Allocation
          await vendorPaymentsService.allocatePayment(organizationId, actorUserId, payment.id, [{
             invoiceId: item.invoiceId,
             amount: Number(item.amount)
          }]);

          // Update Payment to POSTED
          await prisma.vendorPayment.update({
             where: { id: payment.id },
             data: { status: VendorPaymentStatus.POSTED }
          });

          // Route through Treasury Transactions
          if (batch.bankAccount) {
             await treasuryService.createBankTransaction(organizationId, {
                bankAccountId: batch.bankAccountId,
                type: "WITHDRAWAL",
                amount: Number(item.amount),
                description: `Payment Run \${batch.batchNumber} - Vendor \${item.vendor.name}`,
                reference: batch.batchNumber,
                transactionDate: new Date(),
                status: "CLEARED"
             });
          }

          successCount++;
       } catch (err) {
          console.error(`Failed to execute payment for item \${item.id}`, err);
          failureCount++;
       }
    }

    await prisma.paymentBatchExecution.update({
       where: { id: execution.id },
       data: {
          completedAt: new Date(),
          successCount,
          failureCount,
          status: failureCount > 0 ? "PARTIALLY_COMPLETED" : "COMPLETED"
       }
    });

    const finalStatus = failureCount === 0 ? PaymentBatchStatus.EXECUTED : PaymentBatchStatus.EXECUTING;

    // Generate Mock Bank File
    let bankFileS3Key = `bank-files/\${batch.batchNumber}.csv`;

    return prisma.paymentBatch.update({
       where: { id: batch.id },
       data: { 
          status: finalStatus,
          executedAt: new Date(),
          executedById: actorUserId,
          bankFileS3Key
       }
    });
  },

  generateBankFileCsv: async (organizationId: string, batchId: string) => {
    const batch = await prisma.paymentBatch.findFirst({
       where: { id: batchId, organizationId },
       include: { items: { include: { vendor: true, invoice: true } } }
    });
    if (!batch) throw new ApiError(404, "Payment Batch not found");
    if (batch.status !== PaymentBatchStatus.EXECUTED && batch.status !== PaymentBatchStatus.EXECUTING) {
       throw new ApiError(400, "Batch is not executed yet");
    }

    const lines = ["VendorId,VendorName,BankAccount,Amount,Reference"];
    for (const item of batch.items) {
       lines.push(`\${item.vendor.id},\${item.vendor.name},N/A,\${item.amount},\${batch.batchNumber}`);
    }

    return lines.join("\\n");
  },

  getSuggestions: async (organizationId: string) => {
    // Basic logic: return unpaid invoices due soon or overdue
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const invoices = await prisma.vendorInvoice.findMany({
       where: {
          organizationId,
          status: { in: ["POSTED", "PARTIALLY_PAID"] as any },
          dueDate: { lte: nextWeek }
       },
       orderBy: { dueDate: 'asc' }
    });

    return invoices;
  }
};
