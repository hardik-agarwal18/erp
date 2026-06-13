import { Prisma } from "@prisma/client";
import { accountingRepository } from "../accounting.repository.js";
import { accountMappingService } from "../mapping.service.js";
import { GoodsReceiptNoteReceivedPayload } from "../accounting.events.js";
// import removed
import logger from "../../../../config/logger.js";

export const grnAccountingHandler = {
  handle: async (organizationId: string, event: any) => {
    const payload = event.payload as unknown as GoodsReceiptNoteReceivedPayload;
    logger.info({ payload, eventId: event.id }, "Handling GoodsReceiptNoteReceived accounting event");

    // 1. Get required account mappings
    const inventoryAccountId = await accountMappingService.getRequiredAccount(organizationId, "inventoryAccountId");
    const grniAccountId = await accountMappingService.getRequiredAccount(organizationId, "grniAccountId");
    
    // 2. Build journal lines
    const lines = [];

    // Debit Inventory
    lines.push({
      accountId: inventoryAccountId,
      debit: new Prisma.Decimal(payload.totalValue),
      credit: new Prisma.Decimal(0),
      description: `GRN ${payload.grnNumber} Inventory Addition`,
    });

    // Credit GRNI (Liability)
    lines.push({
      accountId: grniAccountId,
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(payload.totalValue),
      description: `GRN ${payload.grnNumber} GRNI Accrual`,
    });

    // 3. Create Journal Entry
    await accountingRepository.createJournalEntry(organizationId, {
      description: `Goods Receipt Note ${payload.grnNumber} accrued`,
      referenceType: "GoodsReceiptNote",
      referenceId: payload.grnId,
      postedAt: new Date(payload.receivedAt || event.createdAt),
      lines,
    });

    return { success: true };
  }
};
