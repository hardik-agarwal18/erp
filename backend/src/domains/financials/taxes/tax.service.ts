
import type { Prisma } from "@prisma/client";
import prisma from "../../../config/database.js";
import type { DatabaseTransactionClient } from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import { taxRepository } from "./tax.repository.js";
import { CreateTaxInput, UpdateTaxInput } from "./tax.types.js";

const enforceDefaultTax = async (
  organizationId: string,
  taxId: string,
  tx: DatabaseTransactionClient,
) => {
  await tx.tax.updateMany({
    where: { organizationId, deletedAt: null, NOT: { id: taxId } },
    data: { isDefault: false },
  });
};

export const taxService = {
  createTax: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateTaxInput,
  ) => {
    const tax = await prisma.$transaction(async (tx) => {
      const created = await tx.tax.create({
        data: {
          organizationId,
          name: payload.name,
          rate: payload.rate,
          type: payload.type,
          isDefault: payload.isDefault ?? false,
        },
      });

      if (created.isDefault) {
        await enforceDefaultTax(organizationId, created.id, tx);
      }

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.TAX_CREATED,
          entityType: AUDIT_ENTITY_TYPES.TAX,
          entityId: created.id,
        },
        tx,
      );

      return created;
    });

    return tax;
  },

  updateTax: async (
    organizationId: string,
    actorUserId: string,
    taxId: string,
    payload: UpdateTaxInput,
  ) => {
    const existing = await taxRepository.findById(organizationId, taxId);
    if (!existing) {
      throw new ApiError(404, "Tax not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const tax = await tx.tax.update({
        where: { id: existing.id },
        data: {
          name: payload.name,
          rate: payload.rate,
          type: payload.type,
          isDefault: payload.isDefault,
        },
      });

      if (tax.isDefault) {
        await enforceDefaultTax(organizationId, taxId, tx);
      }

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.TAX_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.TAX,
          entityId: taxId,
        },
        tx,
      );

      return tax;
    });

    return updated;
  },

  archiveTax: async (
    organizationId: string,
    actorUserId: string,
    taxId: string,
  ) => {
    const existing = await taxRepository.findById(organizationId, taxId);
    if (!existing) {
      throw new ApiError(404, "Tax not found");
    }

    await taxRepository.archiveTax(organizationId, taxId);
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.TAX_ARCHIVED,
      entityType: AUDIT_ENTITY_TYPES.TAX,
      entityId: taxId,
    });
  },

  listTaxes: (
    organizationId: string,
    search: string | undefined,
    query: Record<string, unknown>,
  ) => {
    return taxRepository.listTaxes(organizationId, search, query);
  },

  getTax: async (organizationId: string, taxId: string) => {
    const tax = await taxRepository.findById(organizationId, taxId);
    if (!tax) {
      throw new ApiError(404, "Tax not found");
    }
    return tax;
  },
};
