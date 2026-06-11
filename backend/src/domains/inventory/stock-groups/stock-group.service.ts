// @ts-nocheck
import ApiError from "../../../shared/utils/ApiError.js";
import { stockGroupRepository } from "./stock-group.repository.js";
import { CreateStockGroupInput, StockGroupFilters, UpdateStockGroupInput } from "./stock-group.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../shared/services/audit/index.js";
import prisma from "../../../config/database.js";

export const stockGroupService = {
  create: async (organizationId: string, actorUserId: string, payload: CreateStockGroupInput) => {
    const existing = await stockGroupRepository.findByName(payload.name, organizationId);
    if (existing) {
      throw new ApiError(400, "Stock group with this name already exists");
    }

    if (payload.parentId) {
      const parent = await stockGroupRepository.findById(payload.parentId, organizationId);
      if (!parent) {
        throw new ApiError(404, "Parent stock group not found");
      }
    }

    const stockGroup = await stockGroupRepository.create(organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.STOCK_GROUP_CREATED,
      entityType: AUDIT_ENTITY_TYPES.STOCK_GROUP,
      entityId: stockGroup.id,
      metadata: payload,
    });

    return stockGroup;
  },

  update: async (
    id: string,
    organizationId: string,
    actorUserId: string,
    payload: UpdateStockGroupInput
  ) => {
    const stockGroup = await stockGroupRepository.findById(id, organizationId);
    if (!stockGroup) {
      throw new ApiError(404, "Stock group not found");
    }

    if (payload.name && payload.name !== stockGroup.name) {
      const existing = await stockGroupRepository.findByName(payload.name, organizationId);
      if (existing) {
        throw new ApiError(400, "Stock group with this name already exists");
      }
    }

    if (payload.parentId) {
      if (payload.parentId === id) {
        throw new ApiError(400, "A stock group cannot be its own parent");
      }
      const parent = await stockGroupRepository.findById(payload.parentId, organizationId);
      if (!parent) {
        throw new ApiError(404, "Parent stock group not found");
      }
    }

    await stockGroupRepository.update(id, organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.STOCK_GROUP_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.STOCK_GROUP,
      entityId: id,
      metadata: payload,
    });

    return stockGroupRepository.findById(id, organizationId);
  },

  delete: async (id: string, organizationId: string, actorUserId: string) => {
    const stockGroup = await stockGroupRepository.findById(id, organizationId);
    if (!stockGroup) {
      throw new ApiError(404, "Stock group not found");
    }

    const childrenCount = await prisma.stockGroup.count({
      where: { parentId: id, organizationId, deletedAt: null },
    });
    
    if (childrenCount > 0) {
      throw new ApiError(400, "Cannot delete stock group with child groups");
    }

    const productCount = await prisma.product.count({
      where: { stockGroupId: id, organizationId, deletedAt: null },
    });

    if (productCount > 0) {
      throw new ApiError(400, "Cannot delete stock group that is assigned to products");
    }

    await stockGroupRepository.delete(id, organizationId);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.STOCK_GROUP_DELETED,
      entityType: AUDIT_ENTITY_TYPES.STOCK_GROUP,
      entityId: id,
    });

    return true;
  },

  getById: async (id: string, organizationId: string) => {
    const stockGroup = await stockGroupRepository.findById(id, organizationId);
    if (!stockGroup) {
      throw new ApiError(404, "Stock group not found");
    }
    return stockGroup;
  },

  list: (organizationId: string, filters: StockGroupFilters, query: Record<string, unknown>) => {
    return stockGroupRepository.list(organizationId, filters, query);
  },
};
