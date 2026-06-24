import { CreateVendorInvoiceInput } from "./vendor-invoices.types.js";
import ApiError from "../../../../utils/ApiError.js";
import { VendorInvoiceStatus, MatchStatus, Prisma } from "@prisma/client";
import { eventBus } from "../../../../shared/events/event-bus.js";
import prisma from "../../../../config/database.js";

export const vendorInvoicesService = {
  createDraft: async (organizationId: string, actorUserId: string, payload: CreateVendorInvoiceInput) => {
    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      for (const item of payload.items) {
        subtotal += item.quantity * item.unitPrice;
        totalDiscount += item.discountAmount || 0;
        totalTax += item.taxAmount || 0;
      }

      const totalAmount = subtotal - totalDiscount + totalTax;

      const itemsInput = payload.items.map(item => ({
         productId: item.productId,
         poItemId: item.poItemId,
         quantity: item.quantity,
         unitPrice: item.unitPrice,
         matchStatus: MatchStatus.MATCHED // Default until performThreeWayMatch runs
      }));

      const invoice = await tx.vendorInvoice.create({
        data: {
          organizationId,
          vendorId: payload.vendorId,
          purchaseOrderId: payload.purchaseOrderId,
          invoiceNumber: payload.invoiceNumber,
          invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : new Date(),
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          notes: payload.notes,
          subtotal,
          taxAmount: totalTax,
          discountAmount: totalDiscount,
          totalAmount,
          status: VendorInvoiceStatus.DRAFT,
          matchStatus: MatchStatus.MATCHED, // default
          items: {
            create: itemsInput as any
          }
        },
        include: { items: true }
      });

      return invoice;
    });
  },

  performThreeWayMatch: async (organizationId: string, invoiceId: string) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.vendorInvoice.findFirst({
        where: { id: invoiceId, organizationId },
        include: { items: true }
      });

      if (!invoice) throw new ApiError(404, "Vendor Invoice not found");
      if (!invoice.purchaseOrderId) {
        // Without PO, no match is possible (or it's an expense invoice matching GRN only or non-PO invoice)
        // Set everything to MATCHED for non-PO invoices assuming direct expense
        await tx.vendorInvoice.update({
          where: { id: invoiceId },
          data: { status: VendorInvoiceStatus.PENDING_MATCH, matchStatus: MatchStatus.MATCHED }
        });
        return { matchStatus: MatchStatus.MATCHED };
      }

      const po = await tx.purchaseOrder.findFirst({
        where: { id: invoice.purchaseOrderId, organizationId },
        include: { items: true }
      });

      if (!po) throw new ApiError(404, "Linked PO not found");

      let hasMismatch = false;
      let hasPartialMatch = false;

      let totalQuantityVariance = 0;
      let totalAmountVariance = 0;

      for (const item of invoice.items) {
         if (!(item as any).poItemId) continue;
         const poItem = po.items.find(pi => pi.id === (item as any).poItemId);
         
         let itemMatchStatus: any = MatchStatus.MATCHED;

         if (poItem) {
            const ordered = Number(poItem.quantity); // using quantity for ordered
            const received = Number(poItem.receivedQuantity);
            const billed = Number(item.quantity);
            const lineTotal = (item as any).poItemId ? Number(item.quantity) * Number(item.unitPrice) : Number((item as any).lineTotal);

            if (billed > ordered || billed > received) {
               itemMatchStatus = MatchStatus.MISMATCH;
               hasMismatch = true;
               totalQuantityVariance += (billed - Math.min(ordered, received));
               totalAmountVariance += ((billed - Math.min(ordered, received)) * Number(item.unitPrice));
            } else if (billed < received) {
               itemMatchStatus = MatchStatus.PARTIAL_MATCH;
               hasPartialMatch = true;
            }
         } else {
            itemMatchStatus = MatchStatus.MISMATCH;
            hasMismatch = true;
         }

         await tx.vendorInvoiceItem.update({
            where: { id: item.id },
            data: { matchStatus: itemMatchStatus }
         });
      }

      const overallMatchStatus = hasMismatch ? MatchStatus.MISMATCH : (hasPartialMatch ? MatchStatus.PARTIAL_MATCH : MatchStatus.MATCHED);

      await tx.vendorInvoice.update({
         where: { id: invoiceId },
         data: { 
           status: overallMatchStatus === MatchStatus.MISMATCH ? VendorInvoiceStatus.PENDING_MATCH : VendorInvoiceStatus.MATCHED,
           matchStatus: overallMatchStatus 
         }
      });

      if (hasMismatch) {
         await tx.vendorInvoiceMismatch.upsert({
            where: { invoiceId },
            create: {
               invoiceId,
               quantityVariance: totalQuantityVariance,
               amountVariance: totalAmountVariance,
               taxVariance: 0,
               mismatchReason: "Quantity billed exceeds PO received/ordered quantity"
            },
            update: {
               quantityVariance: totalQuantityVariance,
               amountVariance: totalAmountVariance,
               mismatchReason: "Quantity billed exceeds PO received/ordered quantity"
            }
         });
      }

      return { matchStatus: overallMatchStatus };
    });
  },

  postInvoice: async (organizationId: string, actorUserId: string, invoiceId: string, forceOverride = false) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.vendorInvoice.findFirst({
         where: { id: invoiceId, organizationId },
         include: { items: true }
      });
      if (!invoice) throw new ApiError(404, "Vendor Invoice not found");

      if (invoice.status === VendorInvoiceStatus.POSTED || invoice.status === VendorInvoiceStatus.PAID) {
         throw new ApiError(400, "Invoice already posted");
      }

      if (invoice.matchStatus === MatchStatus.MISMATCH && !forceOverride) {
         throw new ApiError(400, "Cannot post mismatched invoice without override approval.");
      }

      // Decrement PO received and increment PO billed (simplified tracking: update billed on PO if we had a billedQuantity field, but we'll assume it's tracked via invoices)

      const updated = await tx.vendorInvoice.update({
         where: { id: invoiceId },
         data: { status: VendorInvoiceStatus.POSTED }
      });

      await (tx as any).outboxEvent.create({
        data: {
          organizationId,
          aggregateType: "VendorInvoice",
          aggregateId: updated.id,
          eventType: "VendorInvoicePosted",
          payload: {
            invoiceId: updated.id,
            totalAmount: updated.totalAmount,
            vendorId: updated.vendorId,
            actorUserId
          }
        }
      });

      return updated;
    });
  },

  getById: async (organizationId: string, id: string) => {
    const inv = await prisma.vendorInvoice.findFirst({
       where: { id, organizationId },
       include: { items: { include: { product: true } } }
    });
    if (!inv) throw new ApiError(404, "Vendor Invoice not found");
    return inv;
  },

  list: async (organizationId: string) => {
    return prisma.vendorInvoice.findMany({
       where: { organizationId },
       include: { vendor: true },
       orderBy: { createdAt: "desc" } as any
    });
  }
};
