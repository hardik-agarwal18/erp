
import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import { vendorRepository } from "./vendor.repository.js";
import {
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilters,
} from "./vendor.types.js";

export const vendorService = {
  createVendor: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateVendorInput,
  ) => {
    const vendor = await vendorRepository.createVendor(organizationId, payload);
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.VENDOR_CREATED,
      entityType: AUDIT_ENTITY_TYPES.VENDOR,
      entityId: vendor.id,
    });
    return vendor;
  },

  updateVendor: async (
    organizationId: string,
    actorUserId: string,
    vendorId: string,
    payload: UpdateVendorInput,
  ) => {
    const existing = await vendorRepository.findById(organizationId, vendorId);
    if (!existing) {
      throw new ApiError(404, "Vendor not found");
    }

    const updated = await vendorRepository.updateVendor(
      organizationId,
      vendorId,
      payload,
    );
    if (!updated) {
      throw new ApiError(404, "Vendor not found");
    }
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.VENDOR_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.VENDOR,
      entityId: vendorId,
    });
    return updated;
  },

  archiveVendor: async (
    organizationId: string,
    actorUserId: string,
    vendorId: string,
  ) => {
    const existing = await vendorRepository.findById(organizationId, vendorId);
    if (!existing) {
      throw new ApiError(404, "Vendor not found");
    }

    await vendorRepository.archiveVendor(organizationId, vendorId);
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.VENDOR_ARCHIVED,
      entityType: AUDIT_ENTITY_TYPES.VENDOR,
      entityId: vendorId,
    });
  },

  listVendors: (
    organizationId: string,
    filters: VendorFilters,
    query: Record<string, unknown>,
  ) => {
    return vendorRepository.listVendors(organizationId, filters, query);
  },

  getLedger: async (organizationId: string, vendorId: string) => {
    const vendor = await vendorRepository.findById(organizationId, vendorId);
    if (!vendor) {
      throw new ApiError(404, "Vendor not found");
    }

    const [expenses, expenseTotals] = await prisma.$transaction([
      prisma.expense.findMany({
        where: { organizationId, vendorId, deletedAt: null },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.expense.aggregate({
        where: { organizationId, vendorId, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const totalPurchases = Number(expenseTotals._sum.amount ?? 0);

    return {
      vendor,
      purchases: expenses,
      payments: [],
      outstandingPayables: 0,
      totalPurchases,
    };
  },

  getVendor: async (organizationId: string, vendorId: string) => {
    const vendor = await vendorRepository.findById(organizationId, vendorId);
    if (!vendor) {
      throw new ApiError(404, "Vendor not found");
    }
    return vendor;
  },
};
