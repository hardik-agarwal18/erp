import { Prisma } from "@prisma/client";
import { accountingRepository } from "../accounting.repository.js";
import { accountMappingService } from "../mapping.service.js";
import { SalesInvoiceIssuedPayload } from "../accounting.events.js";
// removed
import logger from "../../../../config/logger.js";

export const invoiceAccountingHandler = {
  handle: async (organizationId: string, event: any) => {
    const payload = event.payload as unknown as SalesInvoiceIssuedPayload;
    logger.info({ payload, eventId: event.id }, "Handling SalesInvoiceIssued accounting event");

    // 1. Get required account mappings
    const arAccountId = await accountMappingService.getRequiredAccount(organizationId, "arAccountId");
    const revenueAccountId = await accountMappingService.getRequiredAccount(organizationId, "revenueAccountId");
    
    let taxPayableAccountId: string | undefined;
    if (payload.taxAmount > 0) {
      taxPayableAccountId = await accountMappingService.getRequiredAccount(organizationId, "taxPayableAccountId");
    }

    let cogsAccountId: string | undefined;
    let inventoryAccountId: string | undefined;
    if (payload.cogsAmount && payload.cogsAmount > 0) {
      cogsAccountId = await accountMappingService.getRequiredAccount(organizationId, "cogsAccountId");
      inventoryAccountId = await accountMappingService.getRequiredAccount(organizationId, "inventoryAccountId");
    }

    // 2. Build journal lines
    const lines = [];

    // Debit AR
    lines.push({
      accountId: arAccountId,
      debit: new Prisma.Decimal(payload.totalAmount),
      credit: new Prisma.Decimal(0),
      description: `Sales Invoice ${payload.invoiceNumber} AR`,
    });

    // Credit Revenue
    lines.push({
      accountId: revenueAccountId,
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(payload.subtotal),
      description: `Sales Invoice ${payload.invoiceNumber} Revenue`,
    });

    // Credit Tax
    if (payload.taxAmount > 0 && taxPayableAccountId) {
      lines.push({
        accountId: taxPayableAccountId,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(payload.taxAmount),
        description: `Sales Invoice ${payload.invoiceNumber} Tax`,
      });
    }

    // Post COGS and Inventory Reduction
    if (payload.cogsAmount && payload.cogsAmount > 0 && cogsAccountId && inventoryAccountId) {
      lines.push({
        accountId: cogsAccountId,
        debit: new Prisma.Decimal(payload.cogsAmount),
        credit: new Prisma.Decimal(0),
        description: `Sales Invoice ${payload.invoiceNumber} COGS`,
      });
      lines.push({
        accountId: inventoryAccountId,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(payload.cogsAmount),
        description: `Sales Invoice ${payload.invoiceNumber} Inventory Reduction`,
      });
    }

    // 3. Create Journal Entry
    await accountingRepository.createJournalEntry(organizationId, {
      description: `Invoice ${payload.invoiceNumber} for Customer ${payload.customerId}`,
      referenceType: "SalesInvoice",
      referenceId: payload.invoiceId,

      postedAt: new Date(payload.issuedAt || event.createdAt),
      lines,
    });

    return { success: true };
  }
};
