// @ts-nocheck
import ApiError from "../../../../utils/ApiError.js";
import { batchRepository } from "./batch.repository.js";
import { BatchFilters, ExpiringBatchFilters, BatchTraceabilityResponse } from "./batch.types.js";
import prisma from "../../../../config/database.js";

const getStatus = (expiryDate?: Date | null): "ACTIVE" | "EXPIRING" | "EXPIRED" => {
  if (!expiryDate) return "ACTIVE";
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 30) return "EXPIRING";
  return "ACTIVE";
};

export const batchService = {
  list: async (organizationId: string, filters: BatchFilters, query: Record<string, unknown>) => {
    const result = await batchRepository.list(organizationId, filters, query);
    
    // Map status
    const mappedRows = result.rows.map(row => ({
      ...row,
      status: getStatus(row.expiryDate)
    }));

    return { ...result, rows: mappedRows };
  },

  listExpiring: async (organizationId: string, filters: ExpiringBatchFilters, query: Record<string, unknown>) => {
    const result = await batchRepository.listExpiring(organizationId, filters, query);
    
    // Calculate values by looking up InventoryItem averageCost
    const rows = await Promise.all(result.rows.map(async (row) => {
      // Find average cost from the primary warehouse or globally (approximated here by first item)
      const invItem = await prisma.inventoryItem.findFirst({
        where: { organizationId, productId: row.productId },
        orderBy: { quantity: 'desc' }
      });
      const avgCost = Number(invItem?.averageCost || 0);
      const value = Number(row.quantity) * avgCost;
      
      const now = new Date();
      const diffTime = row.expiryDate!.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...row,
        daysRemaining,
        averageCost: avgCost,
        value,
        status: "EXPIRING"
      };
    }));

    return { ...result, rows };
  },

  listExpired: async (organizationId: string, query: Record<string, unknown>) => {
    const result = await batchRepository.listExpired(organizationId, query);
    
    const rows = await Promise.all(result.rows.map(async (row) => {
      const invItem = await prisma.inventoryItem.findFirst({
        where: { organizationId, productId: row.productId },
        orderBy: { quantity: 'desc' }
      });
      const avgCost = Number(invItem?.averageCost || 0);
      const value = Number(row.quantity) * avgCost;

      return {
        ...row,
        averageCost: avgCost,
        value,
        status: "EXPIRED"
      };
    }));

    return { ...result, rows };
  },

  getById: async (id: string, organizationId: string) => {
    const batch = await batchRepository.findById(id, organizationId);
    if (!batch) throw new ApiError(404, "Batch not found");

    let daysUntilExpiry = null;
    if (batch.expiryDate) {
      const diffTime = batch.expiryDate.getTime() - new Date().getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const invItem = await prisma.inventoryItem.findFirst({
      where: { organizationId, productId: batch.productId },
      orderBy: { quantity: 'desc' }
    });
    const avgCost = Number(invItem?.averageCost || 0);
    const currentValue = Number(batch.quantity) * avgCost;

    return {
      ...batch,
      daysUntilExpiry,
      currentValue,
      status: getStatus(batch.expiryDate)
    };
  },

  getBatchInventory: async (id: string, organizationId: string) => {
    const batchInvs = await batchRepository.getBatchInventoryItems(id, organizationId);
    
    const distribution = await Promise.all(batchInvs.map(async (bi) => {
      const invItem = await prisma.inventoryItem.findFirst({
        where: { organizationId, productId: bi.batch.productId, godownId: bi.godownId }
      });
      const averageCost = Number(invItem?.averageCost || 0);
      const quantity = Number(bi.quantity);
      const value = quantity * averageCost;

      return {
        godownName: bi.godown.name,
        godownId: bi.godownId,
        quantity,
        averageCost,
        value
      };
    }));

    return distribution;
  },

  getBatchMovements: async (id: string, organizationId: string, query: Record<string, unknown>) => {
    return batchRepository.getBatchMovements(id, organizationId, query);
  },

  getBatchTraceability: async (id: string, organizationId: string): Promise<BatchTraceabilityResponse> => {
    const movements = await prisma.inventoryMovement.findMany({
      where: { batchId: id, organizationId },
      include: { godown: true },
      orderBy: { createdAt: "desc" }
    });

    return movements.map(m => ({
      date: m.createdAt,
      eventType: m.type,
      referenceId: m.referenceId || "Unknown",
      quantity: Number(m.quantity),
      godown: m.godown?.name || "Unknown"
    }));
  }
};
