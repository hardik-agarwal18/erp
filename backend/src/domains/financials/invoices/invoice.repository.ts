
import { Prisma } from "@prisma/client";

import prisma, {
  type DatabaseTransactionClient,
} from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

export const invoiceRepository = {
  findById: (organizationId: string, invoiceId: string) => {
    return prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId, deletedAt: null },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
      },
    });
  },
  listInvoices: (
    organizationId: string,
    filters: { status?: string; search?: string },
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where: Record<string, unknown> = {
      organizationId,
      deletedAt: null,
    };
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma
      .$transaction([
        prisma.invoice.findMany({
          where,
          include: { customer: true },
          orderBy: { issueDate: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.invoice.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  findCustomerById: (
    organizationId: string,
    customerId: string,
    client?: DatabaseClient,
  ) => {
    return getClient(client).customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
  },
  findProductsByIds: (
    organizationId: string,
    productIds: string[],
    client?: DatabaseClient,
  ) => {
    return getClient(client).product.findMany({
      where: {
        organizationId,
        id: { in: productIds },
        deletedAt: null,
      },
      include: { tax: true },
    });
  },
  createInvoiceWithItems: async (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      customerId: string;
      sourceType?: "SALES_ORDER" | "DELIVERY_CHALLAN";
      salesOrderId?: string;
      deliveryChallanId?: string;
      invoiceNumber: string;
      status: any;
      issueDate: Date;
      dueDate: Date | null;
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
      notes?: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        taxAmount: number;
        discountAmount: number;
        lineTotal: number;
      }>;
    },
  ) => {
    const created = await tx.invoice.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        sourceType: payload.sourceType ?? "SALES_ORDER",
        salesOrderId: payload.salesOrderId,
        deliveryChallanId: payload.deliveryChallanId,
        invoiceNumber: payload.invoiceNumber,
        status: payload.status,
        issueDate: payload.issueDate,
        dueDate: payload.dueDate,
        subtotal: payload.subtotal,
        taxAmount: payload.taxAmount,
        discountAmount: payload.discountAmount,
        totalAmount: payload.totalAmount,
        amountDue: payload.totalAmount, // amountDue is totalAmount at creation
        notes: payload.notes,
      } as any,
    });

    await tx.invoiceItem.createMany({
      data: payload.items.map((item) => ({
        invoiceId: created.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount,
        discountAmount: item.discountAmount,
        lineTotal: item.lineTotal,
      })),
    });

    return created;
  },
  findInventoryItemForProduct: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    productId: string,
  ) => {
    return tx.inventoryItem.findFirst({
      where: {
        organizationId,
        productId,
        deletedAt: null,
      },
    });
  },
  decrementInventoryItem: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    inventoryItemId: string,
    quantity: number,
  ) => {
    return tx.inventoryItem.updateMany({
      where: {
        id: inventoryItemId,
        organizationId,
        deletedAt: null,
      },
      data: { quantity: { decrement: quantity } },
    });
  },
  createInventoryMovement: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      productId: string;
      quantity: number;
      referenceId: string;
      type: "SALE";
    },
  ) => {
    return tx.inventoryMovement.create({
      data: {
        organizationId,
        productId: payload.productId,
        type: payload.type,
        quantity: payload.quantity,
        referenceId: payload.referenceId,
      },
    });
  },
  createFinancialTransaction: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      type: "SALE";
      referenceType: string;
      referenceId: string;
      amount: number;
      description: string;
    },
  ) => {
    return tx.transaction.create({
      data: {
        organizationId,
        type: payload.type,
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
        amount: payload.amount,
        description: payload.description,
      },
    });
  },
  updateInvoiceForOrganization: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    invoiceId: string,
    payload: {
        status: any;
      dueDate?: Date;
      notes?: string;
    },
  ) => {
    return tx.invoice.updateMany({
      where: {
        id: invoiceId,
        organizationId,
        deletedAt: null,
      },
      data: {
        status: payload.status,
        dueDate: payload.dueDate,
        notes: payload.notes,
      },
    });
  },
  listInvoiceItems: (tx: DatabaseTransactionClient, invoiceId: string) => {
    return tx.invoiceItem.findMany({
      where: { invoiceId },
      include: { product: true },
    });
  },
};

