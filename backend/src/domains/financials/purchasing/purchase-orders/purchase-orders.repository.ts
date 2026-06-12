// @ts-nocheck
import prisma from "../../../../config/database.js";
import { CreatePurchaseOrderInput } from "./purchase-orders.types.js";
import { PurchaseOrderStatus } from "@prisma/client";

export const purchaseOrdersRepository = {
  create: async (organizationId: string, poNumber: string, payload: CreatePurchaseOrderInput) => {
    let totalAmount = 0;
    const itemsData = payload.items.map(item => {
      const lineTotal = (item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0);
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount || 0,
        discountAmount: item.discountAmount || 0,
        lineTotal,
      };
    });

    return prisma.purchaseOrder.create({
      data: {
        organizationId,
        vendorId: payload.vendorId,
        poNumber,
        issueDate: new Date(),
        expectedDeliveryDate: payload.expectedDeliveryDate,
        notes: payload.notes,
        currencyCode: payload.currencyCode || "INR",
        exchangeRate: payload.exchangeRate || 1.0,
        totalAmount,
        status: PurchaseOrderStatus.DRAFT,
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
    return prisma.purchaseOrder.findFirst({
      where: { organizationId, id },
      include: {
        items: true,
        vendor: true,
      },
    });
  },

  list: async (organizationId: string) => {
    return prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: {
        vendor: true,
      },
      orderBy: { issueDate: "desc" },
    });
  },

  updateStatus: async (id: string, status: PurchaseOrderStatus) => {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  },
};
