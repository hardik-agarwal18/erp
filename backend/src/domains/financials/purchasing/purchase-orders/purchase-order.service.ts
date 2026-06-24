import prisma from "../../../../config/database.js";
const p: any = prisma;
import ApiError from "../../../../utils/ApiError.js";
import { workflowService } from "../../../../infrastructure/workflow/workflow.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../../services/audit/index.js";
import { CreatePurchaseOrderInput, RevisePurchaseOrderInput } from "./purchase-order.types.js";
import { parsePagination } from "../../../../shared/utils/pagination.js";

const generatePoNumber = async (organizationId: string) => {
  const count = await p.purchaseOrder.count({ where: { organizationId } });
  return `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

export const purchaseOrderService = {
  createDraft: async (organizationId: string, actorUserId: string, payload: CreatePurchaseOrderInput) => {
    if (!payload.items || payload.items.length === 0) {
      throw new ApiError(400, "Purchase Order must have at least one item");
    }

    const poNumber = await generatePoNumber(organizationId);

    return prisma.$transaction(async (tx) => {
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

      const po = await (tx as any).purchaseOrder.create({
        data: {
          organizationId,
          vendorId: payload.vendorId,
          poNumber,
          status: "DRAFT",
          issueDate: new Date(),
          expectedDeliveryDate: payload.expectedDeliveryDate,
          notes: payload.notes,
          currencyCode: payload.currencyCode || "INR",
          exchangeRate: payload.exchangeRate || 1.0,
          totalAmount,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
        entityId: po.id,
        action: AUDIT_ACTIONS.PURCHASE_ORDER_CREATED,
        userId: actorUserId,
        metadata: { newState: po as any }
      }, tx);

      return po;
    });
  },

  revise: async (organizationId: string, actorUserId: string, poId: string, payload: RevisePurchaseOrderInput) => {
    return prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findFirst({
        where: { id: poId, organizationId },
        include: { items: true },
      });

      if (!po) throw new ApiError(404, "Purchase Order not found");

      // Delete existing items
      await (tx as any).purchaseOrderItem.deleteMany({ where: { purchaseOrderId: po.id } });

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

      const nextRevision = po.revisionNumber + 1;

      const updated = await (tx as any).purchaseOrder.update({
        where: { id: po.id },
        data: {
          revisionNumber: nextRevision,
          totalAmount,
          notes: payload.notes || po.notes,
          status: "DRAFT", // Revising resets approval status to DRAFT
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
        entityId: po.id,
        action: "PURCHASE_ORDER_REVISED" as any, // Extensibility: We can add this to AUDIT_ACTIONS later
        userId: actorUserId,
        metadata: { oldState: po as any, newState: updated as any }
      }, tx);

      return updated;
    });
  },

  submitForApproval: async (organizationId: string, actorUserId: string, poId: string) => {
    return prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findFirst({
        where: { id: poId, organizationId },
      });

      if (!po) throw new ApiError(404, "Purchase Order not found");
      if (po.status !== "DRAFT") {
        throw new ApiError(400, "Only DRAFT Purchase Orders can be submitted");
      }

      // Check Workflow
      const workflowInstance = await workflowService.startWorkflow({
        organizationId,
        entityType: "PURCHASE_ORDER",
        entityId: po.id,
        payload: {
          vendorId: po.vendorId,
          totalAmount: Number(po.totalAmount),
        },
      });

      const nextStatus = workflowInstance ? "PENDING_APPROVAL" : "APPROVED";

      const updated = await (tx as any).purchaseOrder.update({
        where: { id: po.id },
        data: { status: nextStatus },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
        entityId: po.id,
        action: "PURCHASE_ORDER_UPDATED" as any,
        userId: actorUserId,
        metadata: { oldState: po as any, newState: updated as any }
      }, tx);

      return {
        purchaseOrder: updated,
        workflowInstanceId: workflowInstance?.id,
      };
    });
  },

  approvePO: async (organizationId: string, actorUserId: string, poId: string, comments?: string) => {
    return prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findFirst({
        where: { id: poId, organizationId },
      });

      if (!po) throw new ApiError(404, "Purchase Order not found");
      if (po.status !== "PENDING_APPROVAL") {
        throw new ApiError(400, "Purchase Order is not pending approval");
      }

      const updated = await (tx as any).purchaseOrder.update({
        where: { id: po.id },
        data: { status: "APPROVED" },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
        entityId: po.id,
        action: "PURCHASE_ORDER_UPDATED" as any,
        userId: actorUserId,
        metadata: { oldState: po as any, newState: updated as any, comments }
      }, tx);

      return updated;
    });
  },

  rejectPO: async (organizationId: string, actorUserId: string, poId: string, comments?: string) => {
    return prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findFirst({
        where: { id: poId, organizationId },
      });

      if (!po) throw new ApiError(404, "Purchase Order not found");
      if (po.status !== "PENDING_APPROVAL") {
        throw new ApiError(400, "Purchase Order is not pending approval");
      }

      const updated = await (tx as any).purchaseOrder.update({
        where: { id: po.id },
        data: { status: "DRAFT" }, // Revert to DRAFT for revision
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
        entityId: po.id,
        action: "PURCHASE_ORDER_UPDATED" as any,
        userId: actorUserId,
        metadata: { oldState: po as any, newState: updated as any, comments }
      }, tx);

      return updated;
    });
  },

  sendToVendor: async (organizationId: string, actorUserId: string, poId: string) => {
    return prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findFirst({
        where: { id: poId, organizationId },
      });

      if (!po) throw new ApiError(404, "Purchase Order not found");
      if (po.status !== "APPROVED") {
        throw new ApiError(400, "Only APPROVED Purchase Orders can be sent");
      }

      const updated = await (tx as any).purchaseOrder.update({
        where: { id: po.id },
        data: { status: "SENT" },
      });

      await auditService.record({
        organizationId,
        entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
        entityId: po.id,
        action: "PURCHASE_ORDER_UPDATED" as any,
        userId: actorUserId,
        metadata: { oldState: po as any, newState: updated as any }
      }, tx);

      return updated;
    });
  },

  listPOs: async (organizationId: string, query: Record<string, any>) => {
    const pagination = parsePagination(query);
    const where = { organizationId };

    const [items, total] = await prisma.$transaction([
      p.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
        },
        orderBy: { issueDate: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      p.purchaseOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  getPODetails: async (organizationId: string, poId: string) => {
    const po = await p.purchaseOrder.findFirst({
      where: { id: poId, organizationId },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });

    if (!po) throw new ApiError(404, "Purchase Order not found");
    return po;
  },
};
