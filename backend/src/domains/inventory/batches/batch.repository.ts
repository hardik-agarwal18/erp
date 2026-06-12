// @ts-nocheck
import prisma from "../../../../config/database.js";
import { Prisma } from "@prisma/client";
import { BatchFilters, ExpiringBatchFilters } from "./batch.types.js";

export const batchRepository = {
  list: async (organizationId: string, filters: BatchFilters, query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BatchWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.search) {
      where.OR = [
        { batchNumber: { contains: filters.search, mode: "insensitive" } },
        { product: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters.godownId) {
      where.batchInventoryItems = {
        some: { godownId: filters.godownId, quantity: { gt: 0 } },
      };
    }

    const now = new Date();
    const expiringThreshold = new Date();
    expiringThreshold.setDate(now.getDate() + 30);

    if (filters.status === "EXPIRED") {
      where.expiryDate = { lt: now };
    } else if (filters.status === "EXPIRING") {
      where.expiryDate = { gte: now, lte: expiringThreshold };
    } else if (filters.status === "ACTIVE") {
      where.expiryDate = { gt: expiringThreshold };
      // Also include null expiry dates as active
      where.OR = where.OR ? [...where.OR, { expiryDate: null }] : [{ expiryDate: null }, { expiryDate: { gt: expiringThreshold } }];
    }

    if (filters.expiryFrom || filters.expiryTo) {
      where.expiryDate = {};
      if (filters.expiryFrom) {
        where.expiryDate.gte = new Date(filters.expiryFrom);
      }
      if (filters.expiryTo) {
        where.expiryDate.lte = new Date(filters.expiryTo);
      }
    }

    const [rows, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.batch.count({ where }),
    ]);

    return {
      rows,
      totals: { total },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  listExpiring: async (organizationId: string, filters: ExpiringBatchFilters, query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const days = filters.days || 30;
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() + days);

    const where: Prisma.BatchWhereInput = {
      organizationId,
      deletedAt: null,
      expiryDate: { gte: now, lte: threshold },
      quantity: { gt: 0 }
    };

    const [rows, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: { product: true },
        skip,
        take: limit,
        orderBy: { expiryDate: "asc" },
      }),
      prisma.batch.count({ where }),
    ]);

    return {
      rows,
      totals: { total },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  listExpired: async (organizationId: string, query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.BatchWhereInput = {
      organizationId,
      deletedAt: null,
      expiryDate: { lt: now },
      quantity: { gt: 0 }
    };

    const [rows, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: { product: true },
        skip,
        take: limit,
        orderBy: { expiryDate: "desc" },
      }),
      prisma.batch.count({ where }),
    ]);

    return {
      rows,
      totals: { total },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  findById: async (id: string, organizationId: string) => {
    return prisma.batch.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        product: true,
      },
    });
  },

  getBatchInventory: async (batchId: string, organizationId: string) => {
    return prisma.batchInventoryItem.findMany({
      where: { batchId, organizationId, quantity: { gt: 0 } },
      include: { godown: true, batch: { include: { product: { select: { id: true, name: true, sku: true } } } } },
    });
  },
  
  getBatchInventoryItems: async (batchId: string, organizationId: string) => {
    return prisma.batchInventoryItem.findMany({
      where: { batchId, organizationId, quantity: { gt: 0 } },
      include: { godown: true, batch: { include: { product: true } } },
    });
  },

  getBatchMovements: async (batchId: string, organizationId: string, query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = {
      organizationId,
      batchId,
    };

    const [rows, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: { godown: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return {
      rows,
      totals: { total },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
