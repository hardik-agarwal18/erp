import { Prisma } from "@prisma/client";
import { accountingRepository } from "../accounting.repository.js";
import { accountMappingService } from "../mapping.service.js";
import { VendorInvoiceApprovedPayload } from "../accounting.events.js";
// removed
import logger from "../../../../config/logger.js";
import { prisma } from "../../../../config/database.js";

export const vendorInvoiceAccountingHandler = {
  handle: async (organizationId: string, event: any) => {
    const payload = event.payload as unknown as VendorInvoiceApprovedPayload;
    logger.info({ payload, eventId: event.id }, "Handling VendorInvoiceApproved accounting event");

    // 1. Get required account mappings
    const apAccountId = await accountMappingService.getRequiredAccount(organizationId, "apAccountId");
    
    // Check if the invoice is linked to a PO (Three-Way Matching)
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: payload.invoiceId }
    });

    let debitAccountId: string;
    let descriptionType: string;

    if (invoice?.purchaseOrderId) {
      // It's linked to a PO/GRN, so we clear the GRNI liability accrued during GRN
      debitAccountId = await accountMappingService.getRequiredAccount(organizationId, "grniAccountId");
      descriptionType = "GRNI";
    } else {
      // Direct expense/purchase
      debitAccountId = await accountMappingService.getRequiredAccount(organizationId, "inventoryAccountId");
      descriptionType = "Purchase/Expense";
    }
    
    let taxReceivableAccountId: string | undefined;
    if (payload.taxAmount > 0) {
      taxReceivableAccountId = await accountMappingService.getRequiredAccount(organizationId, "taxReceivableAccountId");
    }

    // 2. Build journal lines
    const lines = [];

    // Debit GRNI / Expense
    lines.push({
      accountId: debitAccountId,
      debit: new Prisma.Decimal(payload.subtotal),
      credit: new Prisma.Decimal(0),
      description: `Vendor Invoice ${payload.invoiceNumber} ${descriptionType}`,
    });

    // Debit Tax Receivable (if applicable)
    if (payload.taxAmount > 0 && taxReceivableAccountId) {
      lines.push({
        accountId: taxReceivableAccountId,
        debit: new Prisma.Decimal(payload.taxAmount),
        credit: new Prisma.Decimal(0),
        description: `Vendor Invoice ${payload.invoiceNumber} Tax`,
      });
    }

    // Credit AP
    lines.push({
      accountId: apAccountId,
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(payload.totalAmount),
      description: `Vendor Invoice ${payload.invoiceNumber} AP`,
    });

    // 3. Create Journal Entry
    await accountingRepository.createJournalEntry(organizationId, {
      description: `Vendor Invoice ${payload.invoiceNumber}`,
      referenceType: "VendorInvoice",
      referenceId: payload.invoiceId,
      sourceEventId: event.id,
      postedAt: new Date(payload.approvedAt || event.createdAt),
      lines,
    });

    return { success: true };
  }
};
