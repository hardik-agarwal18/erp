import { Prisma } from "@prisma/client";
import { accountingRepository } from "../accounting.repository.js";
import { accountMappingService } from "../mapping.service.js";
import { CustomerPaymentReceivedPayload } from "../accounting.events.js";
import logger from "../../../../config/logger.js";

export const paymentAccountingHandler = {
  handle: async (organizationId: string, event: any) => {
    const payload = event.payload as unknown as CustomerPaymentReceivedPayload;
    logger.info({ payload, eventId: event.id }, "Handling CustomerPaymentReceived accounting event");

    // 1. Get required account mappings
    const arAccountId = await accountMappingService.getRequiredAccount(organizationId, "arAccountId");
    
    // For payments, the debit account is usually the bank or cash account where the money was received.
    // If not explicitly provided in the payload, we might have a default bank account mapping.
    // For now, we will use a hypothetical default 'bankAccountId' if it exists in the payload, 
    // otherwise fallback to a default configured asset account if necessary.
    // Since we don't have a specific `defaultBankAccountId` in DefaultAccountMapping right now,
    // we require it from the payload or throw an error.
    if (!payload.bankAccountId) {
      throw new Error(`CustomerPaymentReceived event requires 'bankAccountId' to determine the debit account.`);
    }

    const bankAccountId = payload.bankAccountId;

    // 2. Build journal lines
    const lines = [];

    // Debit Bank/Cash
    lines.push({
      accountId: bankAccountId,
      debit: new Prisma.Decimal(payload.amount),
      credit: new Prisma.Decimal(0),
      description: `Payment ${payload.paymentReference} Bank`,
    });

    // Credit AR
    lines.push({
      accountId: arAccountId,
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(payload.amount),
      description: `Payment ${payload.paymentReference} AR`,
    });

    // 3. Create Journal Entry
    await accountingRepository.createJournalEntry(organizationId, {
      description: `Payment ${payload.paymentReference} received from Customer ${payload.customerId}`,
      referenceType: "CustomerPayment",
      referenceId: payload.paymentId,

      postedAt: new Date(payload.receivedAt || event.createdAt),
      lines,
    });

    return { success: true };
  }
};
