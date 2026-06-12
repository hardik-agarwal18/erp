
import ApiError from "../../../utils/ApiError.js";
import { godownRepository } from "./godown.repository.js";
import { CreateGodownInput, GodownFilters, UpdateGodownInput } from "./godown.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import prisma from "../../../config/database.js";

export const godownService = {
  create: async (organizationId: string, actorUserId: string, payload: CreateGodownInput) => {
    const existing = await godownRepository.findByName(payload.name, organizationId);
    if (existing) {
      throw new ApiError(400, "Godown with this name already exists");
    }

    const godown = await godownRepository.create(organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.GODOWN_CREATED,
      entityType: AUDIT_ENTITY_TYPES.GODOWN,
      entityId: godown.id,
      metadata: payload,
    });

    return godown;
  },

  update: async (
    id: string,
    organizationId: string,
    actorUserId: string,
    payload: UpdateGodownInput
  ) => {
    const godown = await godownRepository.findById(id, organizationId);
    if (!godown) {
      throw new ApiError(404, "Godown not found");
    }

    if (payload.name && payload.name !== godown.name) {
      const existing = await godownRepository.findByName(payload.name, organizationId);
      if (existing) {
        throw new ApiError(400, "Godown with this name already exists");
      }
    }

    await godownRepository.update(id, organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.GODOWN_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.GODOWN,
      entityId: id,
      metadata: payload,
    });

    return godownRepository.findById(id, organizationId);
  },

  delete: async (id: string, organizationId: string, actorUserId: string) => {
    const godown = await godownRepository.findById(id, organizationId);
    if (!godown) {
      throw new ApiError(404, "Godown not found");
    }

    // Optional: check if godown has inventory before deleting
    const inventoryCount = await prisma.inventoryItem.count({
      where: { godownId: id, organizationId, quantity: { gt: 0 } },
    });
    
    if (inventoryCount > 0) {
      throw new ApiError(400, "Cannot delete godown with existing stock");
    }

    await godownRepository.delete(id, organizationId);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.GODOWN_DELETED,
      entityType: AUDIT_ENTITY_TYPES.GODOWN,
      entityId: id,
    });

    return true;
  },

  getById: async (id: string, organizationId: string) => {
    const godown = await godownRepository.findById(id, organizationId);
    if (!godown) {
      throw new ApiError(404, "Godown not found");
    }
    return godown;
  },

  list: (organizationId: string, filters: GodownFilters, query: Record<string, unknown>) => {
    return godownRepository.list(organizationId, filters, query);
  },
};
