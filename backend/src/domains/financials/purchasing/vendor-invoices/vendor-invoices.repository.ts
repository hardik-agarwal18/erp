
import prisma from "../../../../config/database.js";
import { CreateVendorInvoiceInput } from "./vendor-invoices.types.js";
import { VendorInvoiceStatus } from "@prisma/client";

export const vendorInvoicesRepository = {
  create: async (organizationId: string, payload: CreateVendorInvoiceInput) => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const itemsData = payload.items.map(item => {
      const lineTotal = (item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0);
      subtotal += (item.quantity * item.unitPrice);
      taxAmount += (item.taxAmount || 0);
      discountAmount += (item.discountAmount || 0);

      return {
        organizationId,
        productId: item.productId,
        poItemId: item.poItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount || 0,
        discountAmount: item.discountAmount || 0,
        lineTotal,
      };
    });

    const totalAmount = subtotal + taxAmount - discountAmount;

    return prisma.vendorInvoice.create({
      data: {
        organizationId,
        vendorId: payload.vendorId,
        purchaseOrderId: payload.purchaseOrderId,
        invoiceNumber: payload.invoiceNumber,
        invoiceDate: new Date(payload.invoiceDate),
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        notes: payload.notes,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        status: VendorInvoiceStatus.DRAFT,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });
  },

  getById: async (organizationId: string, id: string) => {
    return prisma.vendorInvoice.findFirst({
      where: { organizationId, id },
      include: {
        items: true,
        vendor: true,
        purchaseOrder: true,
      },
    });
  },

  list: async (organizationId: string) => {
    return prisma.vendorInvoice.findMany({
      where: { organizationId },
      include: {
        vendor: true,
        purchaseOrder: true,
      },
      orderBy: { invoiceDate: "desc" },
    });
  },

  updateStatus: async (id: string, status: VendorInvoiceStatus) => {
    return prisma.vendorInvoice.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  },
};
