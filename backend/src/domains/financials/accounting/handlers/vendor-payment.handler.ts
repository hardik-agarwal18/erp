import { Prisma } from "@prisma/client";
import { accountingRepository } from "../accounting.repository.js";
import { accountMappingService } from "../mapping.service.js";
import { VendorPaymentCompletedPayload } from "../accounting.events.js";
import logger from "../../../../config/logger.js";

export const vendorPaymentAccountingHandler = {
  handle: async (organizationId: string, event: any) => {
    const payload = event.payload as unknown as VendorPaymentCompletedPayload;
    logger.info({ payload, eventId: event.id }, "Handling VendorPaymentCompleted accounting event");

    // 1. Get required account mappings
    const apAccountId = await accountMappingService.getRequiredAccount(organizationId, "apAccountId");
    
    if (!payload.bankAccountId) {
      throw new Error(`VendorPaymentCompleted event requires 'bankAccountId' to determine the credit account.`);
    }

    const bankAccountId = payload.bankAccountId;

    // 2. Build journal lines
    const lines = [];

    // Debit AP
    lines.push({
      accountId: apAccountId,
      debit: new Prisma.Decimal(payload.amount),
      credit: new Prisma.Decimal(0),
      description: `Payment ${payload.paymentReference} AP`,
    });

    // Credit Bank/Cash
    lines.push({
      accountId: bankAccountId,
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(payload.amount),
      description: `Payment ${payload.paymentReference} Bank`,
    });

    // 3. Create Journal Entry
    await accountingRepository.createJournalEntry(organizationId, {
      description: `Payment ${payload.paymentReference} made to Vendor ${payload.vendorId}`,
      referenceType: "VendorPayment",
      referenceId: payload.paymentId,

      postedAt: new Date(payload.paidAt || event.createdAt),
      lines,
    });

    return { success: true };
  }
};
