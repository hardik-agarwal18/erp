import prisma from "../../../../config/database.js";
const p: any = prisma;
import ApiError from "../../../../utils/ApiError.js";
import { workflowService } from "../../../../infrastructure/workflow/workflow.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../../services/audit/index.js";
import { CreatePurchaseRequisitionInput, UpdatePurchaseRequisitionInput } from "./requisition.types.js";
import { parsePagination } from "../../../../shared/utils/pagination.js";
import { Prisma } from "@prisma/client";

const generateRequisitionNumber = async (organizationId: string) => {
  const count = await p.purchaseRequisition.count({ where: { organizationId } });
  return `PR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

export const requisitionService = {
  createDraft: async (
    organizationId: string,
    actorUserId: string,
    payload: CreatePurchaseRequisitionInput
  ) => {
    if (!payload.items || payload.items.length === 0) {
      throw new ApiError(400, "Requisition must have at least one item");
    }

    const requisitionNumber = await generateRequisitionNumber(organizationId);

    const created = await prisma.$transaction(async (tx) => {
      const pr = await (tx as any).purchaseRequisition.create({
        data: {
          organizationId,
          requestedById: actorUserId,
          requisitionNumber,
          departmentId: payload.departmentId,
          status: "DRAFT",
          requiredDate: payload.requiredDate,
          notes: payload.notes,
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              estimatedPrice: item.estimatedPrice,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { product: true } } as any },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_REQUISITION,
        entityId: pr.id,
        action: AUDIT_ACTIONS.PURCHASE_REQUISITION_CREATED,
        userId: actorUserId,
        metadata: { newState: pr as any }
      }, tx);

      return pr;
    });

    return created;
  },

  submitForApproval: async (organizationId: string, actorUserId: string, requisitionId: string) => {
    return prisma.$transaction(async (tx) => {
      const pr = await (tx as any).purchaseRequisition.findFirst({
        where: { id: requisitionId, organizationId },
        include: { items: true },
      });

      if (!pr) throw new ApiError(404, "Purchase Requisition not found");
      if (pr.status !== "DRAFT") {
        throw new ApiError(400, "Only DRAFT requisitions can be submitted");
      }

      // Check Workflow
      const workflowInstance = await workflowService.startWorkflow({
        organizationId,
        entityType: "PURCHASE_REQUISITION",
        entityId: pr.id,
        payload: {
          requestedById: pr.requestedById,
          departmentId: pr.departmentId,
          totalItems: pr.items.length,
        },
      });

      const nextStatus = workflowInstance ? "PENDING_APPROVAL" : "APPROVED";

      const updated = await (tx as any).purchaseRequisition.update({
        where: { id: pr.id },
        data: { status: nextStatus },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_REQUISITION,
        entityId: pr.id,
        action: AUDIT_ACTIONS.PURCHASE_REQUISITION_UPDATED,
        userId: actorUserId,
        metadata: { oldState: pr as any, newState: updated as any }
      }, tx);

      return {
        requisition: updated,
        workflowInstanceId: workflowInstance?.id,
      };
    });
  },

  approveRequisition: async (organizationId: string, actorUserId: string, requisitionId: string, comments?: string) => {
    return prisma.$transaction(async (tx) => {
      const pr = await (tx as any).purchaseRequisition.findFirst({
        where: { id: requisitionId, organizationId },
      });

      if (!pr) throw new ApiError(404, "Purchase Requisition not found");
      if (pr.status !== "PENDING_APPROVAL") {
        throw new ApiError(400, "Requisition is not pending approval");
      }

      const updated = await (tx as any).purchaseRequisition.update({
        where: { id: pr.id },
        data: { status: "APPROVED" },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_REQUISITION,
        entityId: pr.id,
        action: AUDIT_ACTIONS.PURCHASE_REQUISITION_UPDATED,
        userId: actorUserId,
        metadata: { oldState: pr as any, newState: updated as any, comments }
      }, tx);

      return updated;
    });
  },

  rejectRequisition: async (organizationId: string, actorUserId: string, requisitionId: string, comments?: string) => {
    return prisma.$transaction(async (tx) => {
      const pr = await (tx as any).purchaseRequisition.findFirst({
        where: { id: requisitionId, organizationId },
      });

      if (!pr) throw new ApiError(404, "Purchase Requisition not found");
      if (pr.status !== "PENDING_APPROVAL") {
        throw new ApiError(400, "Requisition is not pending approval");
      }

      const updated = await (tx as any).purchaseRequisition.update({
        where: { id: pr.id },
        data: { status: "REJECTED" },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_REQUISITION,
        entityId: pr.id,
        action: AUDIT_ACTIONS.PURCHASE_REQUISITION_UPDATED,
        userId: actorUserId,
        metadata: { oldState: pr as any, newState: updated as any, comments }
      }, tx);

      return updated;
    });
  },

  listRequisitions: async (organizationId: string, query: Record<string, any>) => {
    const pagination = parsePagination(query);
    const where = { organizationId };

    const [items, total] = await prisma.$transaction([
      p.purchaseRequisition.findMany({
        where,
        include: {
          requestedBy: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      p.purchaseRequisition.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  getRequisitionDetails: async (organizationId: string, requisitionId: string) => {
    const pr = await p.purchaseRequisition.findFirst({
      where: { id: requisitionId, organizationId },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });

    if (!pr) throw new ApiError(404, "Purchase Requisition not found");
    return pr;
  },
};
