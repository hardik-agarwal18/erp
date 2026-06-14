
import { vendorInvoicesRepository } from "./vendor-invoices.repository.js";
import { CreateVendorInvoiceInput } from "./vendor-invoices.types.js";
import ApiError from "../../../../utils/ApiError.js";
import { VendorInvoiceStatus } from "@prisma/client";
import { purchaseOrdersRepository } from "../purchase-orders/purchase-orders.repository.js";
import { accountingService } from "../../accounting/accounting.service.js";
import { approvalsService } from "../../../core/approvals/approvals.service.js";
import { eventBus } from "../../../../shared/events/event-bus.js";
import prisma from "../../../../config/database.js";

// Listen to override approvals
eventBus.on("approval.completed", async (event) => {
  if (event.entityType === "PROCUREMENT_OVERRIDE") {
    console.log(`[EventBus] procurement-override ${event.entityId} approved`);
    // entityId here is the invoiceId
    const invoice = await prisma.vendorInvoice.findUnique({ where: { id: event.entityId } });
    if (invoice && invoice.status === VendorInvoiceStatus.DRAFT) {
      await vendorInvoicesService.postInvoice(event.organizationId, invoice.id, true);
    }
  }
});

eventBus.on("approval.rejected", async (event) => {
  if (event.entityType === "PROCUREMENT_OVERRIDE") {
    const invoice = await prisma.vendorInvoice.findUnique({ where: { id: event.entityId } });
    if (invoice && invoice.status === VendorInvoiceStatus.DRAFT) {
      await vendorInvoicesRepository.updateStatus(invoice.id, VendorInvoiceStatus.DISPUTED);
    }
  }
});

export const vendorInvoicesService = {
  create: async (organizationId: string, payload: CreateVendorInvoiceInput) => {
    return vendorInvoicesRepository.create(organizationId, payload);
  },

  getById: async (organizationId: string, id: string) => {
    const inv = await vendorInvoicesRepository.getById(organizationId, id);
    if (!inv) throw new ApiError(404, "Vendor Invoice not found");
    return inv;
  },

  list: async (organizationId: string) => {
    return vendorInvoicesRepository.list(organizationId);
  },

  getMatchSummary: async (organizationId: string, invoiceId: string) => {
    const invoice = await vendorInvoicesRepository.getById(organizationId, invoiceId);
    if (!invoice) throw new ApiError(404, "Vendor Invoice not found");

    if (!invoice.purchaseOrderId) {
      return { matchStatus: "N/A", items: [], message: "No Purchase Order linked" };
    }

    const po = await purchaseOrdersRepository.getById(organizationId, invoice.purchaseOrderId);
    if (!po) throw new ApiError(404, "Linked Purchase Order not found");

    const items = [];
    let overallMatch = true;

    for (const invItem of invoice.items) {
      const poItemId = (invItem as any).poItemId;
      if (!poItemId) continue;
      const poItem = po.items.find(i => i.id === poItemId);
      if (!poItem) continue;

      const orderedQty = Number(poItem.quantity);
      const receivedQty = Number(poItem.receivedQuantity);
      const billedQty = Number(invItem.quantity);

      const maxAllowedQty = Math.min(orderedQty, receivedQty);
      const isMatch = billedQty <= maxAllowedQty;
      
      if (!isMatch) overallMatch = false;

      items.push({
        productId: invItem.productId,
        productName: (invItem as any).product?.name || "Unknown",
        orderedQty,
        receivedQty,
        billedQty,
        matchStatus: isMatch ? "MATCH" : "MISMATCH"
      });
    }

    return {
      matchStatus: overallMatch ? "MATCH" : "MISMATCH",
      items
    };
  },

  postInvoice: async (organizationId: string, id: string, forceOverride = false) => {
    const invoice = await vendorInvoicesRepository.getById(organizationId, id);
    if (!invoice) throw new ApiError(404, "Vendor Invoice not found");
    if (invoice.status !== VendorInvoiceStatus.DRAFT) {
      throw new ApiError(400, `Cannot post invoice in ${invoice.status} status.`);
    }

    // Three-Way Matching Logic
    if (invoice.purchaseOrderId && !forceOverride) {
      const po = await purchaseOrdersRepository.getById(organizationId, invoice.purchaseOrderId);
      if (!po) throw new ApiError(404, "Linked Purchase Order not found");

      let mismatchFound = false;
      const mismatchReasons: string[] = [];

      for (const invItem of invoice.items) {
        const poItemId = (invItem as any).poItemId;
        if (!poItemId) continue;
        const poItem = po.items.find(i => i.id === poItemId);
        if (!poItem) continue;

        const maxAllowedQty = Math.min(Number(poItem.quantity), Number(poItem.receivedQuantity));
        
        // Ensure billed quantity doesn't exceed what was ordered or what was received
        if (Number(invItem.quantity) > maxAllowedQty) {
          mismatchFound = true;
          mismatchReasons.push(`Item ${invItem.productId} billed qty (${invItem.quantity}) exceeds received or ordered qty (${maxAllowedQty}).`);
        }
      }

      if (mismatchFound) {
        throw new ApiError(409, `Three-Way Match Failed: ${mismatchReasons.join(" ")} Request override approval if necessary.`);
      }
    }

    // Update billed quantities on the PO items
    if (invoice.purchaseOrderId) {
      await prisma.$transaction(async (tx) => {
        for (const item of invoice.items) {
          const poItemId = (item as any).poItemId;
          if (poItemId) {
            await tx.purchaseOrderItem.update({
              where: { id: poItemId },
              data: { billedQuantity: { increment: item.quantity } }
            });
          }
        }
      });
    }

    const updated = await vendorInvoicesRepository.updateStatus(id, VendorInvoiceStatus.POSTED);

    // Accounting Integration
    await accountingService.postVendorInvoice(
      organizationId,
      updated.id,
      updated.invoiceNumber,
      Number(updated.subtotal),
      Number(updated.taxAmount),
      Number(updated.discountAmount),
      Number(updated.totalAmount)
    );

    eventBus.emit("vendor-invoice.posted", { organizationId, invoiceId: updated.id });

    return updated;
  },

  requestOverrideApproval: async (organizationId: string, id: string, userId: string) => {
    const invoice = await vendorInvoicesRepository.getById(organizationId, id);
    if (!invoice) throw new ApiError(404, "Vendor Invoice not found");

    // Initiate Approval via Core Approval Engine
    await approvalsService.submitForApproval(organizationId, "PROCUREMENT_OVERRIDE", id, userId);
    return invoice;
  }
};
