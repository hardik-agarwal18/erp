
import { Prisma } from "@prisma/client";

import prisma, {
  type DatabaseTransactionClient,
} from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { InventoryFilters } from "./inventory.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

const buildItemFilter = (organizationId: string, filters: InventoryFilters) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };
  if (filters.productId) {
    where.productId = filters.productId;
  }
  if (filters.search) {
    where.product = {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }
  return where;
};

export const inventoryRepository = {
  listItems: (
    organizationId: string,
    filters: InventoryFilters,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = buildItemFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.inventoryItem.findMany({
          where,
          include: { product: true },
          orderBy: { updatedAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.inventoryItem.count({ where }),
      ])
      .then(([items, total]: any) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  listMovements: (
    organizationId: string,
    productId: string | undefined,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = {
      organizationId,
      ...(productId ? { productId } : {}),
    };

    return prisma
      .$transaction([
        prisma.inventoryMovement.findMany({
          where,
          include: { product: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.inventoryMovement.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  findInventoryItem: (organizationId: string, productId: string) => {
    return prisma.inventoryItem.findFirst({
      where: { organizationId, productId, deletedAt: null },
    });
  },
  findProductById: (
    organizationId: string,
    productId: string,
    client?: DatabaseClient,
  ) => {
    return getClient(client).product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
    });
  },
  findInventoryItemForUpdate: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    productId: string,
    godownId?: string,
  ) => {
    return tx.inventoryItem.findFirst({
      where: {
        organizationId,
        productId,
        ...(godownId ? { godownId } : {}),
        deletedAt: null,
      },
    });
  },
  createInventoryItem: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    productId: string,
    godownId: string,
    quantity: number,
  ) => {
    return tx.inventoryItem.create({
      data: {
        organizationId,
        productId,
        godownId,
        quantity,
      },
    });
  },
  incrementInventoryItem: (
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
      data: {
        quantity: { increment: quantity },
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
      data: {
        quantity: { decrement: quantity },
      },
    });
  },
  createInventoryMovement: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      productId: string;
      quantity: number;
      godownId?: string;
      referenceId?: string;
      type: "ADJUSTMENT" | "TRANSFER" | "GRN_RECEIPT" | "DELIVERY_DISPATCH";
    },
  ) => {
    return tx.inventoryMovement.create({
      data: {
        organizationId,
        productId: payload.productId,
        godownId: payload.godownId as string,
        type: payload.type as any,
        quantity: payload.quantity,
        referenceId: payload.referenceId,
      },
    });
  },
  createFinancialTransaction: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      type: "PURCHASE" | "SALE";
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
};
